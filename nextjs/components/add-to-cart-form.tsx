"use client";

import { useFormState } from "react-dom";
import { addToCartAction, type CartActionState } from "@/app/actions/cart";

type AddToCartFormProps = {
  productId: string;
  labels: {
    quantity: string;
    addToCart: string;
    added: string;
  };
};

export function AddToCartForm({ productId, labels }: AddToCartFormProps) {
  const [state, formAction] = useFormState<CartActionState, FormData>(
    addToCartAction,
    null,
  );

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end">
      <input type="hidden" name="productId" value={productId} />
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-muted">{labels.quantity}</span>
        <input
          type="number"
          name="quantity"
          min={1}
          defaultValue={1}
          className="w-24 rounded-xl border border-border bg-surface px-3 py-2 text-foreground"
        />
      </label>
      <button
        type="submit"
        className="rounded-full bg-foreground px-8 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
      >
        {labels.addToCart}
      </button>
      {state?.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="text-sm text-accent">{labels.added}</p>
      ) : null}
    </form>
  );
}
