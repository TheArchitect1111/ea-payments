"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { PORTAL_BASE } from "./tenant-config";

const sections = [
  { label: "Overview", href: PORTAL_BASE },
  { label: "Store Analytics", href: `${PORTAL_BASE}/store` },
  { label: "Inner Circle", href: `${PORTAL_BASE}/waitlist` },
  { label: "Vault", href: `${PORTAL_BASE}/vault` },
  { label: "Timeline", href: `${PORTAL_BASE}/timeline` },
  { label: "Impact", href: `${PORTAL_BASE}/impact` },
  { label: "Brand Assets", href: `${PORTAL_BASE}/brand-assets` },
  { label: "NIL Deal Room", href: `${PORTAL_BASE}/nil` },
  { label: "Content / Gallery", href: `${PORTAL_BASE}/gallery` },
] as const;

export function TarrisPortalNav() {
  const pathname = usePathname();
  return (
    <aside className="border-b border-white/10 bg-[#111111] p-5 lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:overflow-y-auto lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between gap-4">
        <Link href={PORTAL_BASE} aria-label="TB3 HQ Overview" className="flex items-center gap-2">
          <span className="text-3xl font-black leading-none tracking-[-0.1em] text-[#A51C30]">TB3</span>
          <span className="border-l border-white/20 pl-2 text-xs font-black tracking-[0.18em]">HQ</span>
        </Link>
        <span aria-label="Athlete profile" className="grid h-12 w-12 place-items-center rounded-full border border-white/20 text-xs font-bold">TB III</span>
      </div>
      <p className="mt-3 text-[9px] tracking-[0.28em] text-white/50">ATHLETE HQ</p>
      <nav aria-label="TB3 HQ navigation" id="hq-nav" className="mt-6 grid grid-cols-2 gap-1 text-sm sm:grid-cols-3 lg:block lg:space-y-1">
        {sections.map((section) => {
          const active = section.href === PORTAL_BASE ? pathname === PORTAL_BASE : pathname === section.href || pathname.startsWith(`${section.href}/`);
          return <Link key={section.href} href={section.href} aria-current={active ? "page" : undefined} className={`block rounded px-3 py-2 font-semibold transition ${active ? "bg-white text-black" : "text-white/70 hover:bg-white/10 hover:text-white"}`}>{section.label}</Link>;
        })}
      </nav>
      <div className="mt-8 hidden text-[10px] leading-6 tracking-[0.16em] text-white/45 lg:block">DISCIPLINE.<br />DETERMINATION.<br />DEVELOPMENT.<br />DESTINY.</div>
    </aside>
  );
}

export function TarrisPortalFrame({ children, contentClassName = "" }: { children: ReactNode; contentClassName?: string }) {
  return <div className="min-h-dvh bg-[#0A0A0A] text-[#F7F5F2] lg:flex"><TarrisPortalNav /><main className={`min-w-0 flex-1 px-4 pb-24 pt-6 sm:px-8 lg:ml-64 ${contentClassName}`}>{children}</main></div>;
}
