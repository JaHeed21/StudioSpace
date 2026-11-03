import { MongoClient, type Db } from "mongodb";

let client: MongoClient | undefined;
let database: Db | undefined;

export async function connectToDatabase(uri: string, databaseName: string): Promise<Db> {
  if (database) return database;

  const nextClient = new MongoClient(uri);
  try {
    await nextClient.connect();
    const nextDatabase = nextClient.db(databaseName);
    await nextDatabase.command({ ping: 1 });
    client = nextClient;
    database = nextDatabase;
    return nextDatabase;
  } catch (error) {
    await nextClient.close();
    throw error;
  }
}

export function getDatabase(): Db {
  if (!database) {
    throw new Error("Database is not connected. Call connectToDatabase first.");
  }
  return database;
}

export function getMongoClient(): MongoClient {
  if (!client) {
    throw new Error("Database is not connected. Call connectToDatabase first.");
  }
  return client;
}

export async function checkDatabaseConnection(): Promise<void> {
  await getDatabase().command({ ping: 1 });
}

export async function closeDatabaseConnection(): Promise<void> {
  const activeClient = client;
  client = undefined;
  database = undefined;
  if (activeClient) await activeClient.close();
}
