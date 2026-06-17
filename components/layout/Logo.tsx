import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  imageClassName?: string;
  showText?: boolean;
  priority?: boolean;
}

export function Logo({
  className,
  imageClassName,
  showText = true,
  priority = false,
}: LogoProps) {
  return (
    <Link
      href="/"
      className={cn("group flex items-center gap-3 transition-opacity hover:opacity-90", className)}
    >
      <Image
        src={SITE.logo}
        alt={`Logo ${SITE.name}`}
        width={56}
        height={56}
        priority={priority}
        className={cn(
          "h-10 w-10 shrink-0 object-contain sm:h-12 sm:w-12 transition-transform duration-300 ease-out group-hover:rotate-90",
          imageClassName,
        )}
      />
      {showText && (
        <span className="flex flex-col">
          <span className="text-base font-bold leading-tight tracking-tight text-primary sm:text-lg">
            {SITE.name}
          </span>
          <span className="hidden text-xs text-muted sm:block">
            Renyah & Alami
          </span>
        </span>
      )}
    </Link>
  );
}
