import "dotenv/config";
import { MongoClient } from "mongodb";
import { env } from "../src/config/env.js";
import type { StudioDocument, StudioInput } from "../src/modules/studios/studio.types.js";

const demoOwner = {
  id: "studiospace-demo-host",
  name: "StudioSpace Demo Host",
  email: "demo-host@example.invalid",
};

const demoStudios: Array<StudioInput & { demoKey: string; rating: number }> = [
  {
    demoKey: "north-light-cyclorama",
    title: "North Light Cyclorama",
    category: "Photo Studios",
    hourlyRate: 95,
    securityDeposit: 150,
    maxCapacity: 10,
    location: "Brooklyn, New York",
    imageUrl: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=85",
    amenities: ["Natural light", "Cyclorama wall", "Lighting equipment", "Makeup area", "Wi-Fi"],
    description: "A sun-washed production loft with a full white cyclorama, flexible lighting, and room for a focused creative crew.",
    rating: 4.9,
  },
  {
    demoKey: "silver-screen-stage",
    title: "Silver Screen Stage",
    category: "Film Stages",
    hourlyRate: 180,
    securityDeposit: 300,
    maxCapacity: 18,
    location: "Queens, New York",
    imageUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1400&q=85",
    amenities: ["Lighting equipment", "Soundproofing", "Air conditioning", "Parking"],
    description: "A versatile sound-treated stage with generous rigging points and clean power for interviews, short films, and branded shoots.",
    rating: 4.8,
  },
  {
    demoKey: "the-signal-podcast-room",
    title: "The Signal Podcast Room",
    category: "Podcast Lounges",
    hourlyRate: 65,
    securityDeposit: 100,
    maxCapacity: 6,
    location: "Silver Lake, Los Angeles",
    imageUrl: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1400&q=85",
    amenities: ["Soundproofing", "Wi-Fi", "Air conditioning", "Kitchen"],
    description: "A warm, acoustically treated conversation room designed for clear voices, relaxed interviews, and polished podcast sessions.",
    rating: 5,
  },
  {
    demoKey: "analog-sound-suite",
    title: "Analog Sound Suite",
    category: "Music Suites",
    hourlyRate: 110,
    securityDeposit: 200,
    maxCapacity: 7,
    location: "East Austin, Texas",
    imageUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1400&q=85",
    amenities: ["Soundproofing", "Air conditioning", "Wi-Fi", "Lounge area"],
    description: "A character-filled recording suite with a treated live room, cozy control area, and space to shape a track from first take to final mix.",
    rating: 4.9,
  },
  {
    demoKey: "clay-and-color-workshop",
    title: "Clay & Color Workshop",
    category: "Art Workshops",
    hourlyRate: 55,
    securityDeposit: 80,
    maxCapacity: 12,
    location: "Portland, Oregon",
    imageUrl: "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=1400&q=85",
    amenities: ["Natural light", "Kitchen", "Wi-Fi", "Accessible entrance"],
    description: "A bright, hands-on workshop with generous work tables, easy-clean surfaces, and a welcoming setup for classes or independent making.",
    rating: 4.7,
  },
  {
    demoKey: "the-editors-loft",
    title: "The Editor’s Loft",
    category: "Photo Studios",
    hourlyRate: 80,
    securityDeposit: 120,
    maxCapacity: 8,
    location: "Mission District, San Francisco",
    imageUrl: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=85",
    amenities: ["Natural light", "Makeup area", "Changing room", "Wi-Fi", "Parking"],
    description: "An airy editorial loft with a calm neutral palette, tall windows, and adaptable corners for portraits, product stories, and small campaigns.",
    rating: 4.8,
  },
];

async function seedDemoStudios(): Promise<void> {
  const client = new MongoClient(env.mongodbUri);
  try {
    await client.connect();
    const database = client.db(env.mongodbDatabase);
    await database.command({ ping: 1 });
    const collection = database.collection<StudioDocument>("studios");
    const now = new Date();
    for (const { demoKey, rating, ...input } of demoStudios) {
      await collection.updateOne(
        { demoKey },
        {
          $set: {
            ...input,
            demoKey,
            ownerId: demoOwner.id,
            ownerName: demoOwner.name,
            ownerEmail: demoOwner.email,
            rating,
            status: "published",
            updatedAt: now,
          },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true },
      );
    }
    console.info(
      `Seeded ${demoStudios.length} clearly marked sample studios into MongoDB database "${env.mongodbDatabase}". This operation is safe to rerun.`,
    );
    for (const studio of demoStudios) console.info(`- ${studio.title}`);
  } finally {
    await client.close();
  }
}

seedDemoStudios().catch((error: unknown) => {
  console.error("Could not seed sample studios", error);
  process.exitCode = 1;
});
