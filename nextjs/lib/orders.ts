import { cartSubtotal, clearCartForUser, getCartLines } from "@/lib/cart";
import { getDb, isDatabaseUrlConfigured } from "@/lib/db";
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase-server";
import type { Database } from "@/types/database";
import type { Order, OrderItem, OrderStatus } from "@/types/order";
import type { CartLine } from "@/types/cart";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];

function hasOrderStore(): boolean {
  return isSupabaseConfigured() || isDatabaseUrlConfigured();
}

function rowToOrderItem(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    unitPrice: row.unit_price,
    quantity: row.quantity,
  };
}

function rowToOrder(row: OrderRow, items: OrderItem[]): Order {
  return {
    id: row.id,
    status: row.status as OrderStatus,
    subtotal: row.subtotal,
    currency: row.currency,
    createdAt: row.created_at,
    paidAt: row.paid_at,
    items,
  };
}

async function findOrderBySessionIdViaSupabase(
  sessionId: string,
): Promise<Order | null> {
  const supabase = createSupabaseServerClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();

  if (error) {
    throw new Error(`Order lookup failed: ${error.message}`);
  }
  if (!order) {
    return null;
  }

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", order.id);

  if (itemsError) {
    throw new Error(`Order items lookup failed: ${itemsError.message}`);
  }

  return rowToOrder(order, (items ?? []).map(rowToOrderItem));
}

async function findOrderBySessionIdViaPostgres(
  sessionId: string,
): Promise<Order | null> {
  const sql = getDb();
  const orders = await sql<OrderRow[]>`
    select * from public.orders
    where stripe_checkout_session_id = ${sessionId}
    limit 1
  `;
  const order = orders[0];
  if (!order) {
    return null;
  }

  const items = await sql<OrderItemRow[]>`
    select * from public.order_items where order_id = ${order.id}::uuid
  `;
  return rowToOrder(order, items.map(rowToOrderItem));
}

export async function getOrderByCheckoutSessionId(
  sessionId: string,
): Promise<Order | null> {
  if (!hasOrderStore()) {
    return null;
  }
  if (isSupabaseConfigured()) {
    return findOrderBySessionIdViaSupabase(sessionId);
  }
  return findOrderBySessionIdViaPostgres(sessionId);
}

function groupItemsByOrderId(rows: OrderItemRow[]): Map<string, OrderItem[]> {
  const map = new Map<string, OrderItem[]>();
  for (const row of rows) {
    const list = map.get(row.order_id) ?? [];
    list.push(rowToOrderItem(row));
    map.set(row.order_id, list);
  }
  return map;
}

async function getOrdersForUserViaSupabase(userId: string): Promise<Order[]> {
  const supabase = createSupabaseServerClient();
  const { data: orderRows, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Order list failed: ${error.message}`);
  }
  if (!orderRows?.length) {
    return [];
  }

  const orderIds = orderRows.map((row) => row.id);
  const { data: itemRows, error: itemsError } = await supabase
    .from("order_items")
    .select("*")
    .in("order_id", orderIds);

  if (itemsError) {
    throw new Error(`Order items list failed: ${itemsError.message}`);
  }

  const itemsByOrder = groupItemsByOrderId(itemRows ?? []);
  return orderRows.map((row) =>
    rowToOrder(row, itemsByOrder.get(row.id) ?? []),
  );
}

async function getOrdersForUserViaPostgres(userId: string): Promise<Order[]> {
  const sql = getDb();
  const orderRows = await sql<OrderRow[]>`
    select * from public.orders
    where user_id = ${userId}::uuid
    order by created_at desc
  `;
  if (orderRows.length === 0) {
    return [];
  }

  const orderIds = orderRows.map((row) => row.id);
  const itemRows = await sql<OrderItemRow[]>`
    select * from public.order_items
    where order_id in ${sql(orderIds)}
  `;
  const itemsByOrder = groupItemsByOrderId(itemRows);
  return orderRows.map((row) =>
    rowToOrder(row, itemsByOrder.get(row.id) ?? []),
  );
}

/** All orders for the signed-in app user, newest first. */
export async function getOrdersForUser(userId: string): Promise<Order[]> {
  if (!hasOrderStore()) {
    return [];
  }
  if (isSupabaseConfigured()) {
    return getOrdersForUserViaSupabase(userId);
  }
  return getOrdersForUserViaPostgres(userId);
}

async function fulfillViaPostgres(
  userId: string,
  sessionId: string,
  lines: CartLine[],
  subtotal: number,
): Promise<Order> {
  const sql = getDb();
  return sql.begin(async (tx) => {
    const existing = await tx<OrderRow[]>`
      select * from public.orders
      where stripe_checkout_session_id = ${sessionId}
      limit 1
    `;
    if (existing[0]) {
      const items = await tx<OrderItemRow[]>`
        select * from public.order_items where order_id = ${existing[0].id}::uuid
      `;
      return rowToOrder(existing[0], items.map(rowToOrderItem));
    }

    for (const line of lines) {
      const updated = await tx<{ id: string }[]>`
        update public.products
        set stock = stock - ${line.quantity}
        where id = ${line.product.id}::uuid
          and stock >= ${line.quantity}
        returning id
      `;
      if (!updated[0]) {
        throw new Error(`Insufficient stock for ${line.product.name}`);
      }
    }

    const inserted = await tx<OrderRow[]>`
      insert into public.orders (
        user_id,
        stripe_checkout_session_id,
        status,
        subtotal,
        currency,
        paid_at
      )
      values (
        ${userId}::uuid,
        ${sessionId},
        'paid',
        ${subtotal},
        'krw',
        now()
      )
      returning *
    `;
    const order = inserted[0];
    if (!order) {
      throw new Error("Order insert failed");
    }

    for (const line of lines) {
      await tx`
        insert into public.order_items (
          order_id,
          product_id,
          product_name,
          unit_price,
          quantity
        )
        values (
          ${order.id}::uuid,
          ${line.product.id}::uuid,
          ${line.product.name},
          ${line.product.price},
          ${line.quantity}
        )
      `;
    }

    await tx`
      delete from public.cart_items where user_id = ${userId}::uuid
    `;

    const items = await tx<OrderItemRow[]>`
      select * from public.order_items where order_id = ${order.id}::uuid
    `;
    return rowToOrder(order, items.map(rowToOrderItem));
  });
}

async function fulfillViaSupabase(
  userId: string,
  sessionId: string,
  lines: CartLine[],
  subtotal: number,
): Promise<Order> {
  const existing = await findOrderBySessionIdViaSupabase(sessionId);
  if (existing) {
    return existing;
  }

  const supabase = createSupabaseServerClient();

  for (const line of lines) {
    const { data: product, error: readError } = await supabase
      .from("products")
      .select("stock")
      .eq("id", line.product.id)
      .maybeSingle();
    if (readError || !product) {
      throw new Error(`Could not read stock for ${line.product.name}`);
    }
    if (product.stock < line.quantity) {
      throw new Error(`Insufficient stock for ${line.product.name}`);
    }
    const { data: updated, error: updateError } = await supabase
      .from("products")
      .update({ stock: product.stock - line.quantity })
      .eq("id", line.product.id)
      .gte("stock", line.quantity)
      .select("id")
      .maybeSingle();
    if (updateError) {
      throw new Error(
        `Stock update failed for ${line.product.name}: ${updateError.message}`,
      );
    }
    if (!updated) {
      throw new Error(`Insufficient stock for ${line.product.name}`);
    }
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: userId,
      stripe_checkout_session_id: sessionId,
      status: "paid",
      subtotal,
      currency: "krw",
      paid_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (orderError || !order) {
    if (orderError?.code === "23505") {
      const retry = await findOrderBySessionIdViaSupabase(sessionId);
      if (retry) {
        return retry;
      }
    }
    throw new Error(`Order insert failed: ${orderError?.message ?? "no row"}`);
  }

  const itemRows = lines.map((line) => ({
    order_id: order.id,
    product_id: line.product.id,
    product_name: line.product.name,
    unit_price: line.product.price,
    quantity: line.quantity,
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(itemRows);
  if (itemsError) {
    throw new Error(`Order items insert failed: ${itemsError.message}`);
  }

  await clearCartForUser(userId);

  const { data: items, error: fetchItemsError } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", order.id);

  if (fetchItemsError) {
    throw new Error(`Order items fetch failed: ${fetchItemsError.message}`);
  }

  return rowToOrder(order, (items ?? []).map(rowToOrderItem));
}

/** Idempotent: creates order from current cart, decrements stock, clears cart. */
export async function fulfillPaidCheckout(
  userId: string,
  checkoutSessionId: string,
): Promise<Order> {
  if (!hasOrderStore()) {
    throw new Error("Orders require Supabase or DATABASE_URL");
  }

  const existing = await getOrderByCheckoutSessionId(checkoutSessionId);
  if (existing) {
    return existing;
  }

  const lines = await getCartLines(userId);
  if (lines.length === 0) {
    throw new Error("Cart is empty");
  }

  const subtotal = cartSubtotal(lines);

  if (isSupabaseConfigured()) {
    return fulfillViaSupabase(userId, checkoutSessionId, lines, subtotal);
  }
  return fulfillViaPostgres(userId, checkoutSessionId, lines, subtotal);
}
