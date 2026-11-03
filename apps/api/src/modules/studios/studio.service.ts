import { ObjectId, type Sort, type WithId } from "mongodb";
import { HttpError } from "../../middleware/error-handler.js";
import { getCollection } from "../../db/collection.js";
import type { Studio, StudioDocument, StudioInput } from "./studio.types.js";

export interface StudioFilters {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sort: "newest" | "price_asc" | "price_desc" | "rating";
  page: number;
  limit: number;
}

function toStudio(document: WithId<StudioDocument>): Studio {
  const {
    _id,
    title,
    category,
    hourlyRate,
    securityDeposit,
    maxCapacity,
    location,
    imageUrl,
    amenities,
    description,
    ownerId,
    ownerName,
    rating,
    demoKey,
    createdAt,
    updatedAt,
  } = document;
  return {
    id: _id.toString(),
    title,
    category,
    hourlyRate,
    securityDeposit,
    maxCapacity,
    location,
    imageUrl,
    amenities,
    description,
    ownerId,
    ownerName,
    rating,
    isDemo: Boolean(demoKey),
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  };
}

function validId(id: string): ObjectId {
  if (!ObjectId.isValid(id)) throw new HttpError(404, "Studio not found");
  return new ObjectId(id);
}

export async function listStudios(filters: StudioFilters): Promise<{
  studios: Studio[];
  pagination: { page: number; limit: number; total: number; pages: number };
}> {
  const query: Record<string, unknown> = { status: "published" };

  if (filters.search) {
    const escaped = filters.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const expression = new RegExp(escaped, "i");
    query.$or = [{ title: expression }, { location: expression }];
  }
  if (filters.category) query.category = filters.category;
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    query.hourlyRate = {
      ...(filters.minPrice !== undefined ? { $gte: filters.minPrice } : {}),
      ...(filters.maxPrice !== undefined ? { $lte: filters.maxPrice } : {}),
    };
  }
  if (filters.minRating !== undefined) query.rating = { $gte: filters.minRating };

  const sort: Sort = {
    newest: { createdAt: -1 as const },
    price_asc: { hourlyRate: 1 as const, createdAt: -1 as const },
    price_desc: { hourlyRate: -1 as const, createdAt: -1 as const },
    rating: { rating: -1 as const, createdAt: -1 as const },
  }[filters.sort];
  const collection = getCollection<StudioDocument>("studios");
  const [documents, total] = await Promise.all([
    collection
      .find(query)
      .sort(sort)
      .skip((filters.page - 1) * filters.limit)
      .limit(filters.limit)
      .toArray(),
    collection.countDocuments(query),
  ]);

  return {
    studios: documents.map(toStudio),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      pages: Math.ceil(total / filters.limit),
    },
  };
}

export async function getFeaturedStudios(): Promise<Studio[]> {
  const documents = await getCollection<StudioDocument>("studios")
    .find({ status: "published" })
    .sort({ createdAt: -1 })
    .limit(6)
    .toArray();
  return documents.map(toStudio);
}

export async function getStudioById(id: string): Promise<Studio> {
  const document = await getCollection<StudioDocument>("studios").findOne({
    _id: validId(id),
    status: "published",
  });
  if (!document) throw new HttpError(404, "Studio not found");
  return toStudio(document);
}

export async function getOwnerStudios(ownerId: string): Promise<Studio[]> {
  const documents = await getCollection<StudioDocument>("studios")
    .find({ ownerId })
    .sort({ createdAt: -1 })
    .toArray();
  return documents.map(toStudio);
}

export async function createStudio(
  input: StudioInput,
  owner: { id: string; name: string; email: string },
): Promise<Studio> {
  const now = new Date();
  const document: Omit<StudioDocument, "_id"> = {
    ...input,
    ownerId: owner.id,
    ownerName: owner.name,
    ownerEmail: owner.email,
    rating: null,
    status: "published",
    createdAt: now,
    updatedAt: now,
  };
  const result = await getCollection<StudioDocument>("studios").insertOne(document);
  return toStudio({ ...document, _id: result.insertedId });
}

export async function updateStudio(
  id: string,
  ownerId: string,
  input: Partial<StudioInput>,
): Promise<Studio> {
  const collection = getCollection<StudioDocument>("studios");
  const objectId = validId(id);
  const existing = await collection.findOne({ _id: objectId });
  if (!existing) throw new HttpError(404, "Studio not found");
  if (existing.ownerId !== ownerId) {
    throw new HttpError(403, "You do not own this studio");
  }

  const updated = await collection.findOneAndUpdate(
    { _id: objectId, ownerId },
    { $set: { ...input, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  if (!updated) throw new HttpError(404, "Studio not found");
  return toStudio(updated);
}

export async function deleteStudio(id: string, ownerId: string): Promise<void> {
  const collection = getCollection<StudioDocument>("studios");
  const objectId = validId(id);
  const existing = await collection.findOne({ _id: objectId });
  if (!existing) throw new HttpError(404, "Studio not found");
  if (existing.ownerId !== ownerId) {
    throw new HttpError(403, "You do not own this studio");
  }

  const result = await collection.deleteOne({ _id: objectId, ownerId });
  if (result.deletedCount !== 1) throw new HttpError(404, "Studio not found");
}

export async function ensureStudioIndexes(): Promise<void> {
  const collection = getCollection<StudioDocument>("studios");
  await Promise.all([
    collection.createIndex({ status: 1, createdAt: -1 }),
    collection.createIndex({ status: 1, category: 1, createdAt: -1 }),
    collection.createIndex({ status: 1, hourlyRate: 1 }),
    collection.createIndex({ ownerId: 1, createdAt: -1 }),
  ]);
}
