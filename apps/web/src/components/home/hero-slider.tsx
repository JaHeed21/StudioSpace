"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDownRight, ArrowRight } from "lucide-react";
import { A11y, Autoplay, EffectFade, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/pagination";
import { StudioLinkButton } from "@/components/ui/studio-button";

const slides = [
  {
    eyebrow: "A space for the next big idea",
    title: "Make room for\nsomething remarkable.",
    description:
      "Find a light-filled studio, a soundproof suite, or the perfect set for whatever you’re making.",
    image:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=2400&q=88",
    alt: "Sunlit creative workspace with a long communal table",
    label: "The daylight studio · Brooklyn, NY",
  },
  {
    eyebrow: "Good work starts with good light",
    title: "Your vision deserves\na better backdrop.",
    description:
      "Explore character-rich spaces built for portraits, campaigns, and the ideas still on your moodboard.",
    image:
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=2400&q=88",
    alt: "Warm editorial interior with carefully styled furniture",
    label: "The Sunday studio · Los Angeles, CA",
  },
  {
    eyebrow: "Gather your people. Press record.",
    title: "Find the space where\nit all comes together.",
    description:
      "From intimate podcast rooms to full-scale production stages, make your next session count.",
    image:
      "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=2400&q=88",
    alt: "Professional recording studio with mixing equipment",
    label: "Good Measure Sound · Austin, TX",
  },
];

export function HeroSlider() {
  return (
    <section aria-label="Featured creative spaces" className="relative">
      <Swiper
        modules={[A11y, Autoplay, EffectFade, Pagination]}
        effect="fade"
        loop
        autoplay={{ delay: 6500, disableOnInteraction: false, pauseOnMouseEnter: true }}
        pagination={{ clickable: true }}
        a11y={{ enabled: true }}
        className="studio-hero-swiper"
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={slide.title}>
            <article className="relative flex min-h-[610px] items-end overflow-hidden bg-[#242321] sm:min-h-[680px] lg:min-h-[720px]">
              <Image
                src={slide.image}
                alt={slide.alt}
                fill
                priority={index === 0}
                sizes="100vw"
                quality={88}
                className="object-cover"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-black/5"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10"
              />
              <div className="relative z-10 mx-auto w-full max-w-[1440px] px-6 pb-24 pt-28 text-white sm:px-10 sm:pb-28 lg:px-16">
                <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-white/75 sm:text-sm">
                  {slide.eyebrow}
                </p>
                <h1 className="max-w-4xl whitespace-pre-line font-heading text-5xl font-semibold leading-[1.02] tracking-[-0.055em] sm:text-6xl lg:text-8xl">
                  {slide.title}
                </h1>
                <p className="mt-6 max-w-xl text-sm leading-6 text-white/80 sm:text-base sm:leading-7">
                  {slide.description}
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <StudioLinkButton
                    href="/studios"
                    variant="light"
                    className="group min-h-12 px-6"
                  >
                    Explore studios
                    <ArrowRight
                      size={16}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </StudioLinkButton>
                  <StudioLinkButton
                    href="/add-studio"
                    variant="secondary"
                    className="min-h-12 border-white/45 text-white hover:bg-white/10"
                  >
                    Host your space
                  </StudioLinkButton>
                </div>
              </div>
              <div className="absolute bottom-8 right-7 z-10 hidden items-center gap-2 text-xs text-white/75 md:flex lg:right-16">
                <ArrowDownRight size={15} />
                {slide.label}
              </div>
            </article>
          </SwiperSlide>
        ))}
      </Swiper>
      <div className="absolute bottom-8 left-6 z-20 text-xs font-medium tracking-wide text-white/70 sm:left-10 lg:left-16">
        <Link href="/#categories" className="hover:text-white">
          Spaces made for making
        </Link>
      </div>
    </section>
  );
}
