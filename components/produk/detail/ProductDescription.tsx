interface ProductDescriptionProps {
  description: string;
}

export function ProductDescription({ description }: ProductDescriptionProps) {
  return (
    <p className="mt-6 text-base leading-relaxed text-muted">{description}</p>
  );
}
