interface ProductWeightProps {
  weight: string;
}

export function ProductWeight({ weight }: ProductWeightProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted">
      <span className="rounded-full bg-cream-2 px-3 py-1 font-medium">
        {weight} g
      </span>
    </div>
  );
}
