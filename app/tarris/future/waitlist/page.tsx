import { TarrisPortalFrame } from "../portal-shell";
import { InnerCircleDirectory } from "../analytics-client";

export default function InnerCirclePage() {
  return <TarrisPortalFrame contentClassName="max-w-screen-2xl"><header className="mb-8"><p className="text-[10px] font-bold tracking-[0.24em] text-[#C41E3A]">TB3 HQ · DROP 01</p><h1 className="mt-2 text-3xl font-black sm:text-5xl">INNER CIRCLE</h1><p className="mt-3 max-w-2xl text-sm text-white/60">Every confirmed signup is numbered in the order it joined.</p></header><InnerCircleDirectory /></TarrisPortalFrame>;
}
