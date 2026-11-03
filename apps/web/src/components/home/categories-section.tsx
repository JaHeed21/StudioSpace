import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";

const categories = [
  {
    title: "Photo Studios",
    detail: "For the perfect frame",
    image:
      "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=900&q=82",
    alt: "Photography studio lighting and set",
  },
  {
    title: "Film Stages",
    detail: "Big ideas, bigger sets",
    image:
      "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=900&q=82",
    alt: "Cinema stage with dramatic theater lighting",
  },
  {
    title: "Podcast Lounges",
    detail: "Find your voice",
    image:
      "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=900&q=82",
    alt: "Microphone and headphones in a recording room",
  },
  {
    title: "Music Suites",
    detail: "Turn it all the way up",
    image:
      "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=900&q=82",
    alt: "Mixing console in a music production studio",
  },
  {
    title: "Art Workshops",
    detail: "Room to get your hands dirty",
    image:
      "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=900&q=82",
    alt: "Creative workshop filled with art supplies",
  },
];

export function CategoriesSection() {
  return (
    <section id="categories" className="scroll-mt-24 bg-[hsl(var(--surface))] py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <SectionHeading
          eyebrow="Made for the medium"
          title="Find your kind of creative."
          description="The right room changes everything. Start with what you’re here to make."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {categories.map((category, index) => (
            <Link
              key={category.title}
              href={`/studios?category=${encodeURIComponent(category.title)}`}
              className={`group relative min-h-[270px] overflow-hidden rounded-[1.35rem] bg-[#242321] sm:min-h-[320px] ${
                index === 0 || index === 3 ? "lg:col-span-2" : "lg:col-span-1"
              }`}
            >
              <Image
                src={category.image}
                alt={category.alt}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition duration-700 group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
              <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 text-white sm:p-6">
                <span>
                  <span className="block font-heading text-xl font-semibold tracking-tight">
                    {category.title}
                  </span>
                  <span className="mt-1 block text-xs text-white/75">{category.detail}</span>
                </span>
                <span className="grid size-9 shrink-0 place-items-center rounded-full border border-white/45 transition group-hover:border-white group-hover:bg-white group-hover:text-[#242321]">
                  <ArrowUpRight size={17} />
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
