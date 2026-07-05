import { cn } from "@/lib/utils";

interface AdminTableProps {
  className?: string;
  children: React.ReactNode;
}

export function AdminTable({ className, children }: AdminTableProps) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-3xl bg-white shadow-sm shadow-slate-200",
        className,
      )}
    >
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        {children}
      </table>
    </div>
  );
}

interface AdminTableHeadProps {
  className?: string;
  children: React.ReactNode;
}

export function AdminTableHead({ className, children }: AdminTableHeadProps) {
  return (
    <thead className={cn("bg-slate-50", className)}>
      <tr>{children}</tr>
    </thead>
  );
}

interface AdminTableHeaderProps {
  className?: string;
  children: React.ReactNode;
}

export function AdminTableHeader({
  className,
  children,
}: AdminTableHeaderProps) {
  return (
    <th
      className={cn("px-5 py-3.5 font-semibold text-slate-600", className)}
    >
      {children}
    </th>
  );
}

interface AdminTableBodyProps {
  className?: string;
  children: React.ReactNode;
}

export function AdminTableBody({ className, children }: AdminTableBodyProps) {
  return (
    <tbody className={cn("divide-y divide-slate-100", className)}>
      {children}
    </tbody>
  );
}

interface AdminTableRowProps {
  className?: string;
  children: React.ReactNode;
}

export function AdminTableRow({ className, children }: AdminTableRowProps) {
  return (
    <tr className={cn("transition-colors hover:bg-slate-50", className)}>
      {children}
    </tr>
  );
}

interface AdminTableCellProps {
  className?: string;
  children: React.ReactNode;
}

export function AdminTableCell({ className, children }: AdminTableCellProps) {
  return <td className={cn("px-5 py-4", className)}>{children}</td>;
}
