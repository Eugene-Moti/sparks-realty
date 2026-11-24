import { CountUp } from "@/components/motion/count-up";
import { Marquee } from "@/components/motion/marquee";
import { cn } from "@/helpers/classname-helper";
import type { SiteStats } from "@/lib/queries/site-settings";

const STAT_LABELS: { key: keyof SiteStats; label: string; suffix?: string }[] = [
  { key: "homes_sold", label: "Homes sold & let", suffix: "+" },
  { key: "happy_clients", label: "Happy clients", suffix: "+" },
  { key: "years", label: "Years in Nairobi" },
  { key: "areas", label: "Neighbourhoods covered" },
];

/** Count-up stats (staff-edited in Admin → Settings; zeros are hidden) + area marquee. */
export function TrustStrip({ stats, areaNames }: { stats: SiteStats; areaNames: string[] }) {
  const visible = STAT_LABELS.filter((s) => stats[s.key] > 0);

  return (
    <section aria-label="Sparks Properties in numbers" className="dark relative border-hairline border-b bg-ink text-ivory">
      {visible.length ? (
        <dl
          className={cn(
            "mx-auto grid max-w-[90rem] gap-px bg-hairline",
            visible.length > 1 && "grid-cols-2",
            visible.length === 3 && "lg:grid-cols-3",
            visible.length === 4 && "lg:grid-cols-4",
          )}
        >
          {visible.map((s) => (
            <div key={s.key} className="flex flex-col gap-2 bg-ink px-6 py-8 sm:px-10">
              <dt className="eyebrow">{s.label}</dt>
              <dd className="font-display text-5xl text-gold-gradient leading-none">
                <CountUp value={stats[s.key]} suffix={s.suffix} />
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      {areaNames.length ? (
        <div className={visible.length ? "border-hairline border-t py-6" : "py-7"}>
          <Marquee duration={50}>
            {areaNames.map((name) => (
              <span key={name} className="flex items-center gap-8 px-8 font-display text-2xl text-ivory/75 sm:text-3xl">
                {name}
                <span aria-hidden="true" className="size-1.5 rotate-45 bg-gold" />
              </span>
            ))}
          </Marquee>
        </div>
      ) : null}
    </section>
  );
}
