"use client";

import { useCurrency } from "@/components/providers/currency-provider";
import { SegmentedGroup, SegmentedItem } from "@/components/ui/toggle-group";
import type { Currency } from "@/lib/format";

export function CurrencyToggle({ className }: { className?: string }) {
  const { currency, setCurrency } = useCurrency();

  return (
    <SegmentedGroup
      type="single"
      value={currency}
      onValueChange={(v) => {
        if (v) setCurrency(v as Currency);
      }}
      aria-label="Display prices in"
      className={className}
    >
      <SegmentedItem value="KES" aria-label="Kenyan shillings">
        KES
      </SegmentedItem>
      <SegmentedItem value="USD" aria-label="US dollars">
        USD
      </SegmentedItem>
    </SegmentedGroup>
  );
}
