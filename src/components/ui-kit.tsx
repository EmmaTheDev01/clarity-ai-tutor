import { Link } from "@tanstack/react-router";
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";

/** Minimal, opinionated primitives for the tutor.vigilance.rw B/W system. */

type ButtonVariant = "primary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.97] active:translate-y-[0.5px] duration-100 ease-out";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:opacity-90",
  outline: "border border-border bg-background text-foreground hover:bg-muted",
  ghost: "text-foreground hover:bg-muted",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2",
  lg: "px-6 py-3",
};

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, BtnProps>(
  ({ variant = "primary", size = "md", className = "", ...rest }, ref) => (
    <button
      ref={ref}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    />
  ),
);
Button.displayName = "Button";

export function LinkButton({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
} & Parameters<typeof Link>[0]) {
  return (
    <Link className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...rest}>
      {children}
    </Link>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...rest }, ref) => (
    <input
      ref={ref}
      className={`h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${className}`}
      {...rest}
    />
  ),
);
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className = "", ...rest }, ref) => (
  <textarea
    ref={ref}
    className={`min-h-24 w-full rounded-md border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${className}`}
    {...rest}
  />
));
Textarea.displayName = "Textarea";

export function Label({
  htmlFor,
  children,
  className = "",
}: {
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={`mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground ${className}`}
    >
      {children}
    </label>
  );
}

export const Card = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className = "", ...rest }, ref) => (
    <div
      ref={ref}
      className={`rounded-lg border border-border bg-background ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
);
Card.displayName = "Card";

export function Divider() {
  return <div className="h-px w-full bg-border" />;
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-5 items-center justify-center rounded border border-border bg-elevated px-1.5 font-mono text-[10px] text-muted-foreground">
      {children}
    </span>
  );
}

export const Pill = forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ children, className = "", ...rest }, ref) => (
    <span
      ref={ref}
      className={`inline-flex items-center gap-1.5 rounded-full border border-border bg-elevated px-2.5 py-0.5 text-xs text-muted-foreground ${className}`}
      {...rest}
    >
      {children}
    </span>
  )
);
Pill.displayName = "Pill";
