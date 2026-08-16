"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useId,
  type InputHTMLAttributes,
} from "react";
import { rankSearch } from "@/lib/utils/searchRanking";

interface AreaOption {
  name: string;
  postalCode?: string;
  areaId?: string;
}

interface AreaSelectProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange" | "type"
  > {
  label: string;
  value: string;
  onChange: (value: string, option?: AreaOption) => void;
  mode?: "remote" | "local";
  fetchOptions?: (query: string) => Promise<AreaOption[]>;
  options?: AreaOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

const inputBase =
  "w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary";
const labelClass = "mb-2 block text-sm font-medium text-muted";

export function AreaSelect({
  label,
  value,
  onChange,
  mode = "remote",
  fetchOptions,
  options: localOptions = [],
  placeholder = "Ketik untuk mencari",
  disabled = false,
  error,
  ...inputProps
}: AreaSelectProps) {
  const [query, setQuery] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  if (prevValue !== value) {
    setPrevValue(value);
    setQuery(value);
  }
  const [options, setOptions] = useState<AreaOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const optionListId = useId();
  const isLocal = mode === "local";

  const doFetch = useCallback(
    async (q: string) => {
      if (!fetchOptions) return;
      if (q.length < 3) {
        setOptions([]);
        setIsOpen(false);
        setFetchError(null);
        return;
      }
      setIsLoading(true);
      setFetchError(null);
      try {
        const result = await fetchOptions(q);
        setOptions(rankSearch(result, q));
        setIsOpen(result.length > 0);
        setHighlightedIndex(-1);
      } catch {
        setFetchError("Gagal memuat data. Coba lagi.");
        setOptions([]);
      } finally {
        setIsLoading(false);
      }
    },
    [fetchOptions],
  );

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    onChange(q);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (q.length < 3) {
      setOptions([]);
      setIsOpen(false);
      setFetchError(null);
      return;
    }

    if (isLocal) {
      const filtered = rankSearch(localOptions, q);
      setOptions(filtered);
      setIsOpen(filtered.length > 0);
      setHighlightedIndex(-1);
    } else {
      debounceRef.current = setTimeout(() => {
        doFetch(q);
      }, 300);
    }
  }

  function handleFocus() {
    if (query.length < 3) return;
    if (isLocal) {
      if (options.length > 0) setIsOpen(true);
    } else if (!isLoading) {
      if (options.length === 0) {
        doFetch(query);
      } else {
        setIsOpen(true);
      }
    }
  }

  function handleSelect(option: AreaOption) {
    setQuery(option.name);
    onChange(option.name, option);
    setIsOpen(false);
    setHighlightedIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < options.length - 1 ? prev + 1 : 0,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : options.length - 1,
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < options.length) {
          handleSelect(options[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  }

  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  function handleBlur() {
    setTimeout(() => setIsOpen(false), 150);
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <label htmlFor={optionListId} className={labelClass}>
        {label} <span className="text-red-500">*</span>
      </label>
      <input
        ref={inputRef}
        id={optionListId}
        type="text"
        value={query}
        onChange={handleInput}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={`${optionListId}-list`}
        aria-activedescendant={
          highlightedIndex >= 0
            ? `${optionListId}-option-${highlightedIndex}`
            : undefined
        }
        aria-invalid={!!error}
        className={`${inputBase} ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
        {...inputProps}
      />

      {isLoading && (
        <div className="absolute right-3 top-9">
          <svg
            className="h-4 w-4 animate-spin text-muted"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </div>
      )}

      {isOpen && options.length > 0 && (
        <ul
          ref={listRef}
          id={`${optionListId}-list`}
          role="listbox"
          className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-2xl border border-slate-200 bg-white shadow-lg"
        >
          {options.map((option, index) => (
            <li
              key={`${option.name}-${option.areaId || index}`}
              id={`${optionListId}-option-${index}`}
              role="option"
              aria-selected={highlightedIndex === index}
              className={`cursor-pointer px-4 py-2.5 text-sm transition ${
                highlightedIndex === index
                  ? "bg-secondary/10 text-secondary"
                  : "text-foreground hover:bg-slate-50"
              }`}
              onMouseDown={() => handleSelect(option)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              {option.name}
            </li>
          ))}
        </ul>
      )}

      {query.length > 0 && query.length < 3 && !isLoading && (
        <p className="mt-1 text-xs text-muted">Ketik minimal 3 huruf.</p>
      )}

      {isOpen && options.length === 0 && !isLoading && !fetchError && query.length >= 3 && (
        <div className="absolute z-50 mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-muted shadow-lg">
          Tidak ditemukan
        </div>
      )}

      {fetchError && (
        <p className="mt-1 text-xs text-red-500">{fetchError}</p>
      )}

      {error && !fetchError && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
