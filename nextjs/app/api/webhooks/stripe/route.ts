import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { fulfillPaidCheckout } from "@/lib/orders";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Missing webhook signature or STRIPE_WEBHOOK_SECRET" },
      { status: 400 },
    );
  }

  const stripe = getStripe();
  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const checkoutSession = event.data.object as Stripe.Checkout.Session;
    if (checkoutSession.payment_status !== "paid") {
      return NextResponse.json({ received: true });
    }

    const userId = checkoutSession.metadata?.userId;
    const sessionId = checkoutSession.id;

    if (!userId || !sessionId) {
      return NextResponse.json(
        { error: "Missing userId metadata on checkout session" },
        { status: 400 },
      );
    }

    try {
      await fulfillPaidCheckout(userId, sessionId);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Fulfillment failed";
      console.error("[stripe webhook] fulfillment failed:", message);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
