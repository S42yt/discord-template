import { Db, MongoClient } from "mongodb";
import * as dotenv from "dotenv";
import Logger from "../../util/Logger";
import client from "../../bot";

dotenv.config();

let mongoClient: MongoClient | null = null;
let database: Db | null = null;

export async function connectDatabase(): Promise<Db> {
  const logger = new Logger(client);

  if (database) {
    return database;
  }

  try {
    const uri = process.env.MONGODB_URI!;
    const databaseName = process.env.DB_NAME!;

    mongoClient = new MongoClient(uri);
    await mongoClient.connect();

    database = mongoClient.db(databaseName);
    logger.info(`Connected to MongoDB database: ${databaseName}`);

    return database;
  } catch (error) {
    logger.error("Failed to connect to MongoDB", error);
    throw error;
  }
}

export async function getCollection<T = any>(collectionName: string) {
  const db = await connectDatabase();
  return db.collection<T>(collectionName);
}

export async function closeConnection(): Promise<void> {
  if (mongoClient) {
    await mongoClient.close();
    mongoClient = null;
    database = null;
  }
}
