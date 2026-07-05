import { cn } from "@/lib/utils";

type InputVariant = "outline" | "filled";
type InputSize = "sm" | "md" | "lg";

const VARIANT_STYLES: Record<InputVariant, string> = {
  outline: "border border-slate-300 bg-white",
  filled: "border border-slate-300 bg-slate-50",
};

const SIZE_STYLES: Record<InputSize, string> = {
  sm: "rounded-3xl px-3 py-2 text-xs",
  md: "rounded-3xl px-4 py-2.5 text-sm",
  lg: "rounded-3xl px-4 py-3 text-sm",
};

interface AdminInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: InputVariant;
  inputSize?: InputSize;
  error?: boolean;
}

export function AdminInput({
  variant = "outline",
  inputSize = "md",
  error = false,
  className,
  ...rest
}: AdminInputProps) {
  return (
    <input
      className={cn(
        "w-full outline-none transition-colors",
        "focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10",
        VARIANT_STYLES[variant],
        SIZE_STYLES[inputSize],
        error && "border-rose-300 focus:border-rose-500 focus:ring-rose-500/10",
        className,
      )}
      {...rest}
    />
  );
}

interface AdminTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: InputVariant;
  inputSize?: InputSize;
  error?: boolean;
}

export function AdminTextarea({
  variant = "outline",
  inputSize = "md",
  error = false,
  className,
  ...rest
}: AdminTextareaProps) {
  return (
    <textarea
      className={cn(
        "w-full outline-none transition-colors resize-none",
        "focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10",
        VARIANT_STYLES[variant],
        SIZE_STYLES[inputSize],
        error && "border-rose-300 focus:border-rose-500 focus:ring-rose-500/10",
        className,
      )}
      {...rest}
    />
  );
}

interface AdminSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  variant?: InputVariant;
  inputSize?: InputSize;
  error?: boolean;
}

export function AdminSelect({
  variant = "outline",
  inputSize = "md",
  error = false,
  className,
  children,
  ...rest
}: AdminSelectProps) {
  return (
    <select
      className={cn(
        "w-full outline-none transition-colors",
        "focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10",
        VARIANT_STYLES[variant],
        SIZE_STYLES[inputSize],
        error && "border-rose-300 focus:border-rose-500 focus:ring-rose-500/10",
        className,
      )}
      {...rest}
    >
      {children}
    </select>
  );
}
