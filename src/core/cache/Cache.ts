import NodeCache from "node-cache";
import { connectDatabase } from "../database/Database";
import { Document, ObjectId } from "mongodb";

export interface CacheOptions {
  ttl: number;
  checkperiod?: number;
  collectionName: string;
}

export class Cache {
  private static instance: Cache;
  private caches: Map<string, EntityCache<any>> = new Map();

  private constructor() {}

  public static getInstance(): Cache {
    if (!Cache.instance) {
      Cache.instance = new Cache();
    }
    return Cache.instance;
  }

  public createEntityCache<T extends Document>(
    options: CacheOptions,
  ): EntityCache<T> {
    if (this.caches.has(options.collectionName)) {
      return this.caches.get(options.collectionName) as EntityCache<T>;
    }

    const cache = new EntityCache<T>(options);
    this.caches.set(options.collectionName, cache);
    return cache;
  }

  public getEntityCache<T extends Document>(
    collectionName: string,
  ): EntityCache<T> | undefined {
    return this.caches.get(collectionName) as EntityCache<T> | undefined;
  }

  public clearAllCaches(): void {
    this.caches.forEach((cache) => cache.clear());
  }
}

export class EntityCache<T extends Document & { _id?: ObjectId; id?: string }> {
  private cache: NodeCache;
  private collectionName: string;

  constructor(options: CacheOptions) {
    this.cache = new NodeCache({
      stdTTL: options.ttl,
      checkperiod: options.checkperiod || options.ttl * 0.2,
    });
    this.collectionName = options.collectionName;

    this.cache.on("expired", (key, value) => {
      this.saveToDatabase(key, value as T);
    });

    this.cache.on("del", (key, value) => {
      if (value) {
        this.saveToDatabase(key, value as T);
      }
    });
  }

  public async get(key: string): Promise<T | undefined> {
    let item = this.cache.get<T>(key);

    if (!item) {
      item = await this.getFromDatabase(key);
      if (item) {
        this.cache.set(key, item);
      }
    }

    return item;
  }

  public set(key: string, value: T): boolean {
    return this.cache.set(key, value);
  }

  public async getOrSet(
    key: string,
    fetchFn: () => Promise<T | null>,
  ): Promise<T | null> {
    const cached = this.cache.get<T>(key);
    if (cached) {
      return cached;
    }

    const value = await fetchFn();
    if (value) {
      this.cache.set(key, value);
      return value;
    }

    return null;
  }

  public del(key: string): number {
    return this.cache.del(key);
  }

  public clear(): void {
    this.cache.flushAll();
  }

  public async syncWithDatabase(): Promise<void> {
    const keys = this.cache.keys();
    for (const key of keys) {
      const value = this.cache.get<T>(key);
      if (value) {
        await this.saveToDatabase(key, value);
      }
    }
  }

  private async getFromDatabase(key: string): Promise<T | undefined> {
    try {
      const db = await connectDatabase();
      const collection = db.collection<T>(this.collectionName);

      let query: any;
      if (key.match(/^[0-9a-fA-F]{24}$/)) {
        query = { _id: new ObjectId(key) };
      } else {
        query = { $or: [{ _id: key }, { id: key }] };
      }

      const result = await collection.findOne(query);
      return result as T | undefined;
    } catch (error) {
      console.error(`Error fetching from database for key ${key}:`, error);
      return undefined;
    }
  }

  private async saveToDatabase(key: string, value: T): Promise<void> {
    try {
      const db = await connectDatabase();
      const collection = db.collection<T>(this.collectionName);

      let filter: any;
      if (value._id) {
        filter = { _id: value._id };
      } else if (key.match(/^[0-9a-fA-F]{24}$/)) {
        filter = { _id: new ObjectId(key) };
        value._id = new ObjectId(key);
      } else {
        filter = { id: key };
        (value as T & { id: string }).id = key;
      }

      await collection.updateOne(filter, { $set: value }, { upsert: true });
    } catch (error) {
      console.error(`Error saving to database for key ${key}:`, error);
    }
  }
}

const cacheManager = Cache.getInstance();
export default cacheManager;
