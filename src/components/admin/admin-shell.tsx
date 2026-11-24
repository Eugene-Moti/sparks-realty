"use client";

import {
  ArrowSquareOutIcon,
  BellRingingIcon,
  FilmStripIcon,
  GearSixIcon,
  HouseLineIcon,
  ListIcon,
  MapTrifoldIcon,
  NewspaperIcon,
  QuotesIcon,
  SignOutIcon,
  SquaresFourIcon,
  TrayIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, type ReactNode, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/helpers/classname-helper";
import { signOut } from "@/lib/admin/actions/auth";
import { roleLabels, type StaffRole } from "@/lib/admin/roles";
import { ConfirmProvider } from "./ui";

type NavItem = { href: string; label: string; icon: ReactNode; roles?: StaffRole[] };

const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: "Work",
    items: [
      { href: "/admin", label: "Dashboard", icon: <SquaresFourIcon /> },
      { href: "/admin/properties", label: "Listings", icon: <HouseLineIcon /> },
      { href: "/admin/enquiries", label: "Enquiries", icon: <TrayIcon />, roles: ["admin", "agent"] },
      { href: "/admin/saved-searches", label: "Saved searches", icon: <BellRingingIcon />, roles: ["admin", "agent"] },
    ],
  },
  {
    group: "Content",
    items: [
      { href: "/admin/areas", label: "Areas", icon: <MapTrifoldIcon /> },
      { href: "/admin/posts", label: "Insights", icon: <NewspaperIcon /> },
      { href: "/admin/testimonials", label: "Testimonials", icon: <QuotesIcon /> },
      { href: "/admin/videos", label: "House tours", icon: <FilmStripIcon /> },
    ],
  },
  {
    group: "Company",
    items: [
      { href: "/admin/team", label: "Team", icon: <UsersThreeIcon /> },
      { href: "/admin/settings", label: "Settings", icon: <GearSixIcon />, roles: ["admin"] },
    ],
  },
];

export type ShellStaff = { id: string; name: string; email: string | null; role: StaffRole; avatarUrl: string | null };

export function AdminShell({ staff, newEnquiries, children }: { staff: ShellStaff; newEnquiries: number; children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <ConfirmProvider>
      <div className="flex min-h-dvh flex-1">
        <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 lg:block">
          <Sidebar staff={staff} newEnquiries={newEnquiries} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Phone / tablet top bar */}
          <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-hairline border-b bg-ink px-4 text-ivory lg:hidden">
            <Link href="/admin" className="flex items-center gap-2">
              <Image src="/brand/logo-compact-on-dark.svg" alt="Sparks Properties admin" width={157} height={28} className="h-7 w-auto" />
            </Link>
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <button type="button" className="grid size-10 place-items-center rounded-full hover:bg-ivory/10" aria-label="Open menu">
                  <ListIcon className="size-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 max-w-[85vw] border-none bg-ink p-0" hideClose>
                <SheetTitle className="sr-only">Admin menu</SheetTitle>
                <SheetDescription className="sr-only">Go to a section of the admin.</SheetDescription>
                <Sidebar staff={staff} newEnquiries={newEnquiries} onNavigate={() => setMenuOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>

          <main id="main" className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
            {/* Cache Components keeps visited pages alive (React <Activity>) and restores their
                state. In the admin every screen must show fresh data — e.g. "New listing" must
                never reopen the last form — so remount the page on every navigation. */}
            <Fragment key={pathname}>{children}</Fragment>
          </main>
        </div>
      </div>
    </ConfirmProvider>
  );
}

function Sidebar({ staff, newEnquiries, onNavigate }: { staff: ShellStaff; newEnquiries: number; onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <nav aria-label="Admin" className="flex h-full flex-col bg-ink text-ivory">
      <div className="relative flex h-20 items-center px-6">
        <Link href="/admin" onClick={onNavigate} className="flex items-center gap-3">
          <Image src="/brand/logo-compact-on-dark.svg" alt="Sparks Properties" width={146} height={26} className="h-6.5 w-auto" />
          <span className="rounded-full border border-gold/30 px-2 py-0.5 text-[0.6rem] text-gold uppercase tracking-[0.2em]">Admin</span>
        </Link>
      </div>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 pb-6" data-lenis-prevent>
        {NAV.map(({ group, items }) => {
          const visible = items.filter((i) => !i.roles || i.roles.includes(staff.role));
          if (!visible.length) return null;
          return (
            <div key={group} className="flex flex-col gap-1">
              <p className="px-3 pb-1 font-medium text-[0.65rem] text-ivory/40 uppercase tracking-[0.22em]">{group}</p>
              {visible.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex h-10 items-center gap-3 rounded-xl px-3 text-sm transition-colors [&_svg]:size-[1.15rem]",
                      active ? "bg-ivory/10 text-ivory" : "text-ivory/65 hover:bg-ivory/5 hover:text-ivory",
                    )}
                  >
                    {active ? <span aria-hidden="true" className="absolute top-2 bottom-2 left-0 w-0.5 rounded-full bg-gold" /> : null}
                    <span className={cn(active ? "text-gold" : "text-ivory/50 group-hover:text-ivory/80")}>{item.icon}</span>
                    {item.label}
                    {item.href === "/admin/enquiries" && newEnquiries > 0 ? (
                      <span className="ml-auto rounded-full bg-green-500 px-2 py-0.5 font-mono text-[0.65rem] text-ink" aria-label={`${newEnquiries} new`}>
                        {newEnquiries > 99 ? "99+" : newEnquiries}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 border-ivory/10 border-t p-4">
        <Link href="/" target="_blank" className="flex items-center gap-2 px-2 text-ivory/60 text-xs hover:text-ivory">
          <ArrowSquareOutIcon /> View website
        </Link>
        <div className="flex items-center gap-3 rounded-2xl bg-ivory/5 p-2.5">
          <div className="relative size-9 shrink-0 overflow-hidden rounded-full bg-ink-3">
            {staff.avatarUrl ? (
              <Image src={staff.avatarUrl} alt="" fill sizes="36px" className="object-cover" />
            ) : (
              <span className="grid size-full place-items-center font-display text-gold">{staff.name.slice(0, 1).toUpperCase()}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <Link href="/admin/team/me" onClick={onNavigate} className="block truncate font-medium text-sm hover:text-gold">
              {staff.name}
            </Link>
            <p className="truncate text-[0.7rem] text-ivory/50">{roleLabels[staff.role]}</p>
          </div>
          <form action={signOut}>
            <button type="submit" className="grid size-8 place-items-center rounded-full text-ivory/60 hover:bg-ivory/10 hover:text-ivory" aria-label="Sign out">
              <SignOutIcon className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
