import Image from "next/image";
import { BadgeCheck, Headset, ShieldCheck, Wrench } from "lucide-react";
import { StudioLinkButton } from "@/components/ui/studio-button";

const protections = [
  {
    title: "Verified profiles",
    description: "Know who you’re meeting. Hosts and creators are part of a real community.",
    icon: BadgeCheck,
  },
  {
    title: "Equipment safety",
    description: "Clear house rules and equipment details help everyone work with confidence.",
    icon: Wrench,
  },
  {
    title: "Liability protection",
    description: "Added peace of mind for eligible bookings, so the focus stays on the work.",
    icon: ShieldCheck,
  },
  {
    title: "Real host support",
    description: "A human team is here to help when the details need a little extra care.",
    icon: Headset,
  },
];

export function HostGuarantee() {
  return (
    <section id="hosts" className="scroll-mt-24 bg-[hsl(var(--surface))] py-20 sm:py-24 lg:py-28">
      <div className="mx-auto grid max-w-[1440px] gap-12 px-5 sm:px-8 lg:grid-cols-[.95fr_1.05fr] lg:items-center lg:gap-20 lg:px-12">
        <div className="relative min-h-[420px] overflow-hidden rounded-[1.7rem] bg-[#242321] sm:min-h-[560px]">
          <Image
            src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=85"
            alt="Creative team collaborating around a large studio table"
            fill
            sizes="(max-width: 1024px) 100vw, 48vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 max-w-sm text-white sm:bottom-9 sm:left-9">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/75">
              Built on good people
            </p>
            <p className="mt-3 font-heading text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
              Great spaces deserve great care.
            </p>
          </div>
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.17em] text-[hsl(var(--accent))]">
            The StudioSpace promise
          </p>
          <h2 className="max-w-2xl font-heading text-3xl font-semibold leading-tight tracking-[-0.045em] sm:text-4xl lg:text-5xl">
            Good work happens when everyone feels at home.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-[hsl(var(--muted-foreground))] sm:text-base sm:leading-7">
            From your first message to pack-up time, we’re building a marketplace that respects the people and spaces behind every project.
          </p>
          <ul className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {protections.map(({ title, description, icon: Icon }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-[hsl(var(--background))] text-[hsl(var(--accent))]">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="mt-1 block text-xs leading-5 text-[hsl(var(--muted-foreground))]">
                    {description}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <StudioLinkButton href="/studios" className="mt-8">
            Find your space
          </StudioLinkButton>
        </div>
      </div>
    </section>
  );
}
