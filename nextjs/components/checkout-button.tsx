"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  startCheckoutAction,
  type CheckoutActionState,
} from "@/app/actions/checkout";

type CheckoutButtonProps = {
  disabled?: boolean;
  disabledReason?: string;
  labels: {
    payWithCard: string;
    redirecting: string;
  };
};

function SubmitLabel({ redirecting, payWithCard }: CheckoutButtonProps["labels"]) {
  const { pending } = useFormStatus();
  return pending ? redirecting : payWithCard;
}

export function CheckoutButton({
  disabled,
  disabledReason,
  labels,
}: CheckoutButtonProps) {
  const [state, formAction] = useFormState<CheckoutActionState, FormData>(
    startCheckoutAction,
    null,
  );

  const isDisabled = Boolean(disabled);

  return (
    <div className="flex flex-col items-end gap-2">
      <form action={formAction}>
        <button
          type="submit"
          disabled={isDisabled}
          className="rounded-full bg-accent px-8 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <SubmitLabel {...labels} />
        </button>
      </form>
      {disabledReason ? (
        <p className="max-w-sm text-right text-sm text-muted">{disabledReason}</p>
      ) : null}
      {state?.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
