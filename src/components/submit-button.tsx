"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";

interface SubmitButtonProps extends ButtonProps {
  /** Text shown while the form action is running. Defaults to the normal children. Pass "" for icon-only buttons. */
  pendingText?: string;
}

/**
 * Drop-in replacement for form submit buttons. Shows a spinning
 * reloading indicator and disables the button while the server
 * action is running. Must be rendered inside a `<form action={...}>`.
 */
export function SubmitButton({ children, pendingText, disabled, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button {...props} type="submit" disabled={pending || disabled}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" aria-hidden />
          {pendingText ?? children}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
