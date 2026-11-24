"use client";

import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import type { ComponentProps } from "react";
import { DayPicker } from "react-day-picker";
import { enGB } from "react-day-picker/locale";
import { cn } from "@/helpers/classname-helper";

export type CalendarProps = ComponentProps<typeof DayPicker>;

/**
 * Brand-styled react-day-picker (no library CSS). Range selections draw a
 * soft gold band with solid end caps; disabled days are muted. Modifier
 * classes land on the day cell, so button styles use `[&>button]`.
 * Weeks start on Monday (en-GB), as Kenyan calendars do.
 */
export function Calendar({ className, classNames, modifiers, modifiersClassNames, components, ...props }: CalendarProps) {
  // A range with only a start day: still show that day as chosen while the visitor picks the end.
  const anchor = props.mode === "range" && props.selected?.from && !props.selected.to ? props.selected.from : undefined;

  return (
    <DayPicker
      locale={enGB}
      showOutsideDays={false}
      className={cn("relative w-fit select-none text-sm", className)}
      classNames={{
        months: "relative flex flex-col gap-6 sm:flex-row sm:gap-8",
        month: "flex flex-col gap-3",
        month_caption: "flex h-10 items-center justify-center",
        caption_label: "font-display text-lg tracking-wide",
        nav: "pointer-events-none absolute inset-x-0 top-0 z-10 flex h-10 items-center justify-between",
        button_previous:
          "pointer-events-auto grid size-10 place-items-center rounded-full text-foreground/80 transition-colors hover:bg-foreground/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-30",
        button_next:
          "pointer-events-auto grid size-10 place-items-center rounded-full text-foreground/80 transition-colors hover:bg-foreground/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-30",
        month_grid: "border-collapse",
        weekdays: "",
        weekday: "h-8 w-10 pb-1 font-medium text-[0.7rem] text-muted uppercase tracking-wider sm:w-11",
        weeks: "",
        week: "",
        day: "relative h-10 w-10 p-0 text-center sm:h-11 sm:w-11",
        day_button:
          "relative z-10 mx-auto grid size-10 place-items-center rounded-full font-mono text-[0.85rem] tabular-nums transition-[background-color,color,box-shadow] duration-150 hover:bg-foreground/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:hover:bg-transparent sm:size-11",
        today: "[&>button]:font-semibold [&>button]:text-accent [&>button]:underline [&>button]:decoration-1 [&>button]:underline-offset-4",
        selected: "",
        range_middle:
          "bg-gold/15 dark:bg-gold/12 [&>button]:rounded-none [&>button]:hover:bg-gold/20 [&>button]:text-foreground",
        range_start:
          "rounded-l-full bg-gold/15 dark:bg-gold/12 [&>button]:bg-foreground [&>button]:text-background [&>button]:hover:bg-foreground",
        range_end:
          "rounded-r-full bg-gold/15 dark:bg-gold/12 [&>button]:bg-foreground [&>button]:text-background [&>button]:hover:bg-foreground",
        disabled: "[&>button]:text-foreground/30",
        outside: "opacity-0",
        hidden: "invisible",
        focused: "",
        ...classNames,
      }}
      modifiers={anchor ? { ...modifiers, rangeAnchor: anchor } : modifiers}
      modifiersClassNames={{
        rangeAnchor: "[&>button]:bg-foreground [&>button]:text-background [&>button]:hover:bg-foreground",
        ...modifiersClassNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? <CaretLeftIcon aria-hidden="true" className="size-4.5" /> : <CaretRightIcon aria-hidden="true" className="size-4.5" />,
        ...components,
      }}
      {...props}
    />
  );
}

export default Calendar;
