"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { StudioLogo } from "@/components/ui/studio-logo";

const footerLinks = [
  {
    title: "Explore",
    links: [
      { label: "Photo studios", href: "/studios?category=Photo%20Studios" },
      { label: "Film stages", href: "/studios?category=Film%20Stages" },
      { label: "Podcast lounges", href: "/studios?category=Podcast%20Lounges" },
      { label: "Music suites", href: "/studios?category=Music%20Suites" },
      { label: "Art workshops", href: "/studios?category=Art%20Workshops" },
    ],
  },
  {
    title: "StudioSpace",
    links: [
      { label: "How it works", href: "/#how-it-works" },
      { label: "Host your space", href: "/add-studio" },
      { label: "Sign in", href: "/login" },
      { label: "Create an account", href: "/register" },
    ],
  },
];

export function SiteFooter() {
  const [email, setEmail] = useState("");

  const subscribe = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) return;
    toast.info("Newsletter signups are coming soon. Thanks for your interest!");
    setEmail("");
  };

  return (
    <footer className="bg-[#242321] text-white">
      <div className="mx-auto max-w-[1440px] px-5 pb-8 pt-16 sm:px-8 sm:pt-20 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_1.5fr_1.1fr] lg:gap-16">
          <div>
            <StudioLogo className="text-2xl text-white" />
            <p className="mt-5 max-w-xs text-sm leading-6 text-white/60">
              A little more room for the ideas you can&apos;t stop thinking about.
            </p>
            <a
              href="https://x.com"
              target="_blank"
              rel="noreferrer"
              aria-label="StudioSpace on X"
              className="mt-6 inline-flex size-10 items-center justify-center rounded-full border border-white/20 text-sm font-semibold transition hover:border-white/50 hover:bg-white/10"
            >
              𝕏
            </a>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {footerLinks.map((column) => (
              <div key={column.title}>
                <h2 className="text-sm font-semibold">{column.title}</h2>
                <ul className="mt-5 space-y-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-white/60 transition hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div>
            <h2 className="font-heading text-xl font-semibold tracking-tight">
              A little inspiration, occasionally.
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/60">
              New spaces, creative stories, and things worth making time for.
            </p>
            <form onSubmit={subscribe} className="mt-5 flex gap-2">
              <label className="sr-only" htmlFor="newsletter-email">Email address</label>
              <input
                id="newsletter-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Your email address"
                className="h-11 min-w-0 flex-1 rounded-full border border-white/20 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/50"
              />
              <button
                type="submit"
                aria-label="Join newsletter"
                className="grid size-11 shrink-0 place-items-center rounded-full bg-[hsl(var(--accent))] text-white transition hover:bg-[hsl(var(--accent-strong))]"
              >
                <ArrowRight size={17} />
              </button>
            </form>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/15 pt-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} StudioSpace. Made for making.</p>
          <div className="flex gap-5">
            <Link href="/#privacy" className="hover:text-white/80">Privacy</Link>
            <Link href="/#terms" className="hover:text-white/80">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
