import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteNavbar />
      <main className="min-h-[65vh]">{children}</main>
      <SiteFooter />
    </>
  );
}
