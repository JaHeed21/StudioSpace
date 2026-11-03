import { ObjectId, type WithId } from "mongodb";
import { getCollection } from "../../db/collection.js";
import { getDatabase } from "../../db/mongodb.js";
import { HttpError } from "../../middleware/error-handler.js";
import type { StudioDocument } from "../studios/studio.types.js";

interface WishlistDocument {
  userId: string;
  studioId: string;
  createdAt: Date;
}

function publicStudio(document: WithId<StudioDocument>) {
  return {
    id: document._id.toString(),
    title: document.title,
    category: document.category,
    hourlyRate: document.hourlyRate,
    rating: document.rating,
    location: document.location,
    imageUrl: document.imageUrl,
  };
}

export async function getWishlist(userId: string) {
  const entries = await getCollection<WishlistDocument>("wishlists")
    .find({ userId })
    .sort({ createdAt: -1 })
    .toArray();
  const ids = entries.filter((entry) => ObjectId.isValid(entry.studioId)).map((entry) => new ObjectId(entry.studioId));
  if (!ids.length) return { studios: [] };
  const studios = await getCollection<StudioDocument>("studios")
    .find({ _id: { $in: ids }, status: "published" })
    .toArray();
  return { studios: studios.map(publicStudio) };
}

export async function addToWishlist(userId: string, studioId: string): Promise<void> {
  if (!ObjectId.isValid(studioId)) throw new HttpError(404, "Studio not found");
  const id = new ObjectId(studioId).toString();
  const studio = await getCollection<StudioDocument>("studios").findOne({
    _id: new ObjectId(id),
    status: "published",
  });
  if (!studio) throw new HttpError(404, "Studio not found");
  try {
    await getCollection<WishlistDocument>("wishlists").updateOne(
      { userId, studioId: id },
      { $setOnInsert: { userId, studioId: id, createdAt: new Date() } },
      { upsert: true },
    );
  } catch (error) {
    if (!(typeof error === "object" && error !== null && "code" in error && error.code === 11000)) {
      throw error;
    }
  }
}

export async function removeFromWishlist(userId: string, studioId: string): Promise<void> {
  if (!ObjectId.isValid(studioId)) throw new HttpError(404, "Studio not found");
  await getCollection<WishlistDocument>("wishlists").deleteOne({
    userId,
    studioId: new ObjectId(studioId).toString(),
  });
}

export async function ensureWishlistIndexes(): Promise<void> {
  await getDatabase().collection<WishlistDocument>("wishlists").createIndex(
    { userId: 1, studioId: 1 },
    { unique: true },
  );
}
