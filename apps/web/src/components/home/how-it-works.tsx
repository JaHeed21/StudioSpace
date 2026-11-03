import { CalendarDays, Compass, MousePointer2, Sparkles } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";

const steps = [
  {
    number: "01",
    title: "Discover spaces",
    description: "Find the right atmosphere, equipment, and location for your next project.",
    icon: Compass,
  },
  {
    number: "02",
    title: "Select shoot hours",
    description: "Choose the date and time that works for your crew and your creative flow.",
    icon: CalendarDays,
  },
  {
    number: "03",
    title: "Book instantly",
    description: "Confirm the details with your host and lock in the space, without the back and forth.",
    icon: MousePointer2,
  },
  {
    number: "04",
    title: "Create & produce",
    description: "Show up, settle in, and make something you’re proud to put your name on.",
    icon: Sparkles,
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <SectionHeading
          eyebrow="Easy from first look to final cut"
          title="Less searching. More making."
          description="A thoughtful booking experience, so you can spend your energy where it belongs."
          centered
        />
        <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {steps.map(({ number, title, description, icon: Icon }) => (
            <li key={number} className="relative border-t border-[hsl(var(--border))] pt-6">
              <span className="absolute -top-3 left-0 bg-[hsl(var(--background))] pr-3 text-xs font-semibold tracking-[0.12em] text-[hsl(var(--accent))]">
                {number}
              </span>
              <span className="mb-5 grid size-12 place-items-center rounded-2xl bg-[hsl(var(--accent)/.1)] text-[hsl(var(--accent))]">
                <Icon size={21} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <h3 className="font-heading text-lg font-semibold tracking-tight">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                {description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
