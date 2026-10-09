"use client";

import { useFormState } from "react-dom";
import {
  removeFromCartAction,
  updateCartQuantityAction,
  type CartActionState,
} from "@/app/actions/cart";

type CartLineControlsProps = {
  productId: string;
  quantity: number;
  labels: {
    quantity: string;
    update: string;
    remove: string;
  };
};

export function CartLineControls({
  productId,
  quantity,
  labels,
}: CartLineControlsProps) {
  const [updateState, updateAction] = useFormState<CartActionState, FormData>(
    updateCartQuantityAction,
    null,
  );
  const [removeState, removeAction] = useFormState<CartActionState, FormData>(
    removeFromCartAction,
    null,
  );

  const error = updateState?.error ?? removeState?.error;

  return (
    <div className="flex flex-col items-end gap-2">
      <form action={updateAction} className="flex items-center gap-2">
        <input type="hidden" name="productId" value={productId} />
        <label className="sr-only" htmlFor={`qty-${productId}`}>
          {labels.quantity}
        </label>
        <input
          id={`qty-${productId}`}
          type="number"
          name="quantity"
          min={0}
          defaultValue={quantity}
          className="w-16 rounded-lg border border-border bg-background px-2 py-1 text-sm tabular-nums"
        />
        <button
          type="submit"
          className="rounded-full border border-border px-3 py-1 text-xs font-medium hover:border-foreground/30"
        >
          {labels.update}
        </button>
      </form>
      <form action={removeAction}>
        <input type="hidden" name="productId" value={productId} />
        <button type="submit" className="text-xs text-muted hover:text-foreground">
          {labels.remove}
        </button>
      </form>
      {error ? (
        <p className="max-w-[12rem] text-right text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
