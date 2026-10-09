import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { Database } from "@/types/database";
import type { AdminOrder, AdminOrderItem, OrderStatus } from "@/types/order";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];

type OrderListRow = OrderRow & {
  users: { email: string; display_name: string } | null;
  order_items: OrderItemRow[] | null;
};

function rowToOrderItem(row: OrderItemRow): AdminOrderItem {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    unitPrice: row.unit_price,
    quantity: row.quantity,
  };
}

function rowToAdminOrder(row: OrderListRow): AdminOrder {
  const status = row.status as OrderStatus;
  const items = (row.order_items ?? []).map(rowToOrderItem);

  return {
    id: row.id,
    userId: row.user_id,
    customerEmail: row.users?.email ?? "—",
    customerName: row.users?.display_name ?? "",
    stripeCheckoutSessionId: row.stripe_checkout_session_id,
    status,
    subtotal: row.subtotal,
    currency: row.currency,
    createdAt: row.created_at,
    paidAt: row.paid_at,
    items,
  };
}

export async function listOrders(limit = 100): Promise<AdminOrder[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      users ( email, display_name ),
      order_items ( * )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`주문 목록 조회 실패: ${error.message}`);
  }

  return ((data ?? []) as OrderListRow[]).map(rowToAdminOrder);
}

export async function getOrderCount(): Promise<number> {
  const supabase = createSupabaseServerClient();
  const { count, error } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true });

  if (error) {
    throw new Error(`주문 개수 조회 실패: ${error.message}`);
  }

  return count ?? 0;
}
