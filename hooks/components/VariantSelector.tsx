'use client';

import { ProductVariant } from '@/lib/database.types';

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedVariant: ProductVariant;
  onVariantChange: (variant: ProductVariant) => void;
}

export function VariantSelector({
  variants,
  selectedVariant,
  onVariantChange,
}: VariantSelectorProps) {
  if (variants.length <= 1) return null;

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Select Variant</label>
      <div className="flex flex-wrap gap-2">
        {variants.map((variant) => (
          <button
            key={variant.id}
            onClick={() => onVariantChange(variant)}
            className={`px-4 py-2 text-sm border rounded-lg transition-all ${
              selectedVariant.id === variant.id
                ? 'border-black bg-black text-white'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            {variant.name}
          </button>
        ))}
      </div>
    </div>
  );
}
