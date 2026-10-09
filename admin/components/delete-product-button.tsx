"use client";

import { deleteProductAction } from "@/app/actions/products";

type DeleteProductButtonProps = {
  productId: string;
  confirmMessage: string;
  label: string;
};

export function DeleteProductButton({
  productId,
  confirmMessage,
  label,
}: DeleteProductButtonProps) {
  return (
    <form
      action={deleteProductAction}
      onSubmit={(event) => {
        const ok = window.confirm(confirmMessage);
        if (!ok) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={productId} />
      <button
        type="submit"
        className="text-sm text-red-700 hover:underline"
      >
        {label}
      </button>
    </form>
  );
}
