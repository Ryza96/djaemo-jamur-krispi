import { cn } from "@/lib/utils";

interface AdminKeyValueProps {
  label: string;
  value: React.ReactNode;
  className?: string;
}

export function AdminKeyValue({ label, value, className }: AdminKeyValueProps) {
  return (
    <div className={cn(className)}>
      <div className="mb-0.5 text-xs text-slate-500">{label}</div>
      <div className="text-sm text-slate-900">{value ?? "-"}</div>
    </div>
  );
}
