"use client";

import { motion } from "motion/react";
import { useReducedMotion } from "@/components/motion/use-reduced-motion";
import { Slider } from "radix-ui";
import { useId, useState } from "react";
import { easeOut } from "@/components/motion/easing";
import { useCurrency } from "@/components/providers/currency-provider";
import { Input } from "@/components/ui/input";
import { cn } from "@/helpers/classname-helper";
import { formatMoney } from "@/lib/format";

/** Monthly repayment of an amortising loan. */
export function monthlyRepayment(principal: number, annualRatePct: number, years: number): number {
  const n = years * 12;
  if (principal <= 0 || n <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return principal / n;
  return (principal * r) / (1 - (1 + r) ** -n);
}

const STAMP_DUTY = 0.04; // Nairobi (urban) rate on the purchase price
const LEGAL_FEES = 0.015; // typical conveyancing estimate

const kes = new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 });

/** Price, deposit %, rate and term → monthly repayment, with an animated donut. Estimates only. */
export function MortgageCalculator({ priceKes }: { priceKes: number }) {
  const { currency, usdRate } = useCurrency();
  const reduce = useReducedMotion();
  const ids = useId();
  const [price, setPrice] = useState(Math.round(priceKes));
  const [depositPct, setDepositPct] = useState(20);
  const [rate, setRate] = useState(13.5);
  const [years, setYears] = useState(20);

  const deposit = (price * depositPct) / 100;
  const loan = Math.max(price - deposit, 0);
  const monthly = monthlyRepayment(loan, rate, years);
  const totalRepaid = monthly * years * 12;
  const interest = Math.max(totalRepaid - loan, 0);
  const upfront = deposit + price * STAMP_DUTY + price * LEGAL_FEES;
  const money = (v: number) => formatMoney(v, currency, usdRate);
  const loanShare = totalRepaid > 0 ? loan / totalRepaid : 1;

  return (
    <div className="grid gap-8 rounded-(--radius-card) border border-hairline bg-surface p-5 sm:p-7 md:grid-cols-[minmax(0,1fr)_18.5rem]">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor={`${ids}-price`} className="font-medium text-sm">
            Property price (KES)
          </label>
          <Input
            id={`${ids}-price`}
            inputMode="numeric"
            value={kes.format(price)}
            onChange={(e) => {
              const n = Number(e.target.value.replace(/\D/g, ""));
              setPrice(Number.isFinite(n) ? Math.min(n, 5_000_000_000) : 0);
            }}
            className="font-mono"
          />
        </div>
        <RangeField
          label="Deposit"
          value={depositPct}
          min={10}
          max={60}
          step={5}
          onChange={setDepositPct}
          display={`${depositPct}% · ${money(deposit)}`}
        />
        <RangeField label="Loan term" value={years} min={5} max={25} step={1} onChange={setYears} display={`${years} years`} />
        <div className="flex flex-col gap-2">
          <label htmlFor={`${ids}-rate`} className="font-medium text-sm">
            Interest rate (% per year)
          </label>
          <Input
            id={`${ids}-rate`}
            type="number"
            inputMode="decimal"
            min={0}
            max={30}
            step={0.1}
            value={rate}
            onChange={(e) => setRate(Math.min(Math.max(Number(e.target.value) || 0, 0), 30))}
            className="w-32 font-mono"
            aria-describedby={`${ids}-rate-hint`}
          />
          <p id={`${ids}-rate-hint`} className="text-muted text-xs">
            Rates vary by lender and change over time — ask your bank or SACCO for a quote.
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-5 md:border-hairline md:border-l md:pl-8">
        <div className="relative size-48">
          <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden="true">
            <circle cx="60" cy="60" r="50" fill="none" strokeWidth="12" className="stroke-gold-400/30 dark:stroke-gold/25" />
            <motion.circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              strokeWidth="12"
              strokeLinecap="round"
              className="stroke-green-600 dark:stroke-green-400"
              initial={false}
              animate={{ pathLength: loanShare }}
              transition={{ duration: reduce ? 0 : 0.8, ease: easeOut }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center" aria-live="polite">
            <span className="text-muted text-xs">Per month</span>
            <span className="font-medium font-mono text-lg leading-tight">{money(monthly)}</span>
          </div>
        </div>
        <dl className="flex w-full flex-col gap-2 text-sm">
          <Legend swatch="bg-green-600 dark:bg-green-400" label="Loan amount" value={money(loan)} />
          <Legend swatch="bg-gold-400/50 dark:bg-gold/40" label="Total interest" value={money(interest)} />
          <Legend label="Total repaid" value={money(totalRepaid)} strong />
          <div className="my-1 border-hairline border-t" />
          <Legend label="Cash needed upfront*" value={money(upfront)} strong />
        </dl>
      </div>

      <p className="text-muted text-xs leading-relaxed md:col-span-2">
        *Deposit + stamp duty (4% in Nairobi) + legal fees (about 1.5%). Estimates for planning only — not a loan
        offer. Valuation, bank and insurance fees vary.
      </p>
    </div>
  );
}

function RangeField({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium">{label}</span>
        <span className="font-mono text-muted">{display}</span>
      </div>
      <Slider.Root
        className="relative flex h-6 w-full touch-none select-none items-center"
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(v) => onChange(v[0])}
      >
        <Slider.Track className="relative h-1 grow rounded-full bg-foreground/12">
          <Slider.Range className="absolute h-full rounded-full bg-gold-600 dark:bg-gold" />
        </Slider.Track>
        <Slider.Thumb
          aria-label={label}
          aria-valuetext={display}
          className="block size-5 rounded-full border-2 border-gold-600 bg-surface shadow-soft transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30 dark:border-gold"
        />
      </Slider.Root>
    </div>
  );
}

function Legend({ swatch, label, value, strong }: { swatch?: string; label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex min-w-0 items-center gap-2 text-muted">
        {swatch ? <span aria-hidden="true" className={cn("size-2.5 rounded-full", swatch)} /> : null}
        {label}
      </dt>
      <dd className={cn("whitespace-nowrap text-right font-mono", strong && "font-medium text-foreground")}>{value}</dd>
    </div>
  );
}

/** Rentals: what it takes to move in, and a simple income guide. */
export function RentAffordability({
  rentKes,
  depositMonths,
  serviceChargeKes,
}: {
  rentKes: number;
  depositMonths: number | null;
  serviceChargeKes: number | null;
}) {
  const { currency, usdRate } = useCurrency();
  const money = (v: number) => formatMoney(v, currency, usdRate);
  const months = depositMonths ?? 2;
  const service = serviceChargeKes ?? 0;
  const moveIn = rentKes * months + rentKes + service;

  return (
    <div className="grid gap-6 rounded-(--radius-card) border border-hairline bg-surface p-5 sm:grid-cols-2 sm:p-7">
      <div className="flex flex-col gap-3">
        <p className="eyebrow text-accent">To move in</p>
        <dl className="flex flex-col gap-2 text-sm">
          <Legend label={`Deposit (${months} month${months === 1 ? "" : "s"})${depositMonths ? "" : " — typical"}`} value={money(rentKes * months)} />
          <Legend label="First month's rent" value={money(rentKes)} />
          {service ? <Legend label="Service charge (month 1)" value={money(service)} /> : null}
          <div className="my-1 border-hairline border-t" />
          <Legend label="Total to move in" value={money(moveIn)} strong />
        </dl>
      </div>
      <div className="flex flex-col gap-3 sm:border-hairline sm:border-l sm:pl-6">
        <p className="eyebrow text-accent">Affordability guide</p>
        <p className="font-medium font-mono text-2xl">{money((rentKes + service) * 3)}</p>
        <p className="text-muted text-sm leading-relaxed">
          Suggested monthly household income, keeping rent{service ? " and service charge" : ""} to about a third of
          take-home pay. A guide only — every landlord decides for themselves.
        </p>
      </div>
    </div>
  );
}
