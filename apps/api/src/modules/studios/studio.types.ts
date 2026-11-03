import type { ObjectId } from "mongodb";

export const STUDIO_CATEGORIES = [
  "Photo Studios",
  "Film Stages",
  "Podcast Lounges",
  "Music Suites",
  "Art Workshops",
] as const;

export interface StudioInput {
  title: string;
  category: (typeof STUDIO_CATEGORIES)[number];
  hourlyRate: number;
  securityDeposit: number;
  maxCapacity: number;
  location: string;
  imageUrl: string;
  amenities: string[];
  description: string;
}

export interface StudioDocument extends StudioInput {
  _id?: ObjectId;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  rating: number | null;
  demoKey?: string;
  status: "published";
  createdAt: Date;
  updatedAt: Date;
}

export interface Studio extends StudioInput {
  id: string;
  ownerId: string;
  ownerName: string;
  rating: number | null;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}
