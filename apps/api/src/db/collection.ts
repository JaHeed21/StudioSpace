import type { Collection, Document } from "mongodb";
import { getDatabase } from "./mongodb.js";

export function getCollection<T extends Document>(name: string): Collection<T> {
  return getDatabase().collection<T>(name);
}

