"use client";

import { useId } from "react";
import { CloudUpload } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminUploadProps {
  onFileSelect?: (file: File) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function AdminUpload({
  onFileSelect,
  accept,
  multiple = false,
  disabled = false,
  className,
  children,
}: AdminUploadProps) {
  const id = useId();

  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition-colors hover:border-slate-400 hover:bg-slate-100",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      {children ?? (
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-slate-200">
            <CloudUpload className="h-6 w-6 text-slate-500" />
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-600">
            Klik untuk pilih file
          </span>
        </div>
      )}
      <input
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && onFileSelect) onFileSelect(file);
          e.target.value = "";
        }}
      />
    </label>
  );
}
