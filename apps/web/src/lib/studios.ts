import type { StudioCardData } from "@/components/studios/studio-card";

export interface Studio extends StudioCardData {
  securityDeposit: number;
  maxCapacity: number;
  amenities: string[];
  description: string;
  ownerId: string;
  ownerName: string;
  createdAt: string;
  updatedAt: string;
}

export const STUDIO_CATEGORIES = [
  "Photo Studios",
  "Film Stages",
  "Podcast Lounges",
  "Music Suites",
  "Art Workshops",
] as const;

export const AMENITIES = [
  "Natural light",
  "Lighting equipment",
  "Cyclorama wall",
  "Soundproofing",
  "Wi-Fi",
  "Air conditioning",
  "Makeup area",
  "Changing room",
  "Parking",
  "Kitchen",
  "Props",
  "Accessible entrance",
] as const;

export function formatStudioDate(date: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}
