"use client";

import { useState } from "react";
import { Chip, ToggleGroup } from "@/components/ui/toggle-group";
import type { PostSummary } from "@/lib/queries/content";
import { PostCard } from "./post-card";

/** Lead story + grid, with a category filter when there's more than one category. */
export function InsightsList({ posts }: { posts: PostSummary[] }) {
  const categories = [...new Set(posts.map((p) => p.category).filter((c): c is string => !!c))];
  const [category, setCategory] = useState("all");
  const shown = category === "all" ? posts : posts.filter((p) => p.category === category);
  const [lead, ...rest] = shown;

  if (!posts.length) {
    return <p className="rounded-(--radius-card) border border-hairline border-dashed p-10 text-center text-muted">Our first market notes are on the way.</p>;
  }

  return (
    <div className="flex flex-col gap-14">
      {categories.length > 1 ? (
        <ToggleGroup type="single" value={category} onValueChange={(v) => v && setCategory(v)} aria-label="Filter by category" className="flex flex-wrap gap-2">
          <Chip value="all">All</Chip>
          {categories.map((c) => (
            <Chip key={c} value={c}>
              {c}
            </Chip>
          ))}
        </ToggleGroup>
      ) : null}
      <p className="sr-only" aria-live="polite">
        Showing {shown.length} insight{shown.length === 1 ? "" : "s"}
      </p>
      {lead ? <PostCard post={lead} large headingLevel={2} /> : null}
      {rest.length ? (
        <ul className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((p) => (
            <li key={p.id}>
              <PostCard post={p} headingLevel={2} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
