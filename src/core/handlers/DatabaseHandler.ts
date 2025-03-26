import { Client } from "discord.js";
import { Db, MongoClient } from "mongodb";
import * as dotenv from "dotenv";
import Logger from "../../util/Logger";

dotenv.config();

export class DatabaseHandler {
  private client: Client;
  private mongoClient: MongoClient;
  private database?: Db;
  private logger: Logger;
  private databaseName: string;
  private uri: string;

  constructor(client: Client) {
    this.client = client;
    this.logger = new Logger(client);
    this.databaseName = process.env.DB_NAME!;
    this.uri = process.env.MONGODB_URI!;
    this.mongoClient = new MongoClient(this.uri);
  }

  public async initialize(): Promise<void> {
    try {
      await this.mongoClient.connect();
      this.database = this.mongoClient.db(this.databaseName);
      this.logger.info(`Connected to MongoDB database: ${this.databaseName}`);

      const admin = this.mongoClient.db().admin();
      const dbList = await admin.listDatabases();
      const dbExists = dbList.databases.some(
        (db) => db.name === this.databaseName,
      );

      if (!dbExists) {
        await this.database.createCollection("Users");
        this.logger.info(
          `Database '${this.databaseName}' did not exist and was created with an initial collection.`,
        );
      } else {
        this.logger.info(`Database '${this.databaseName}' already exists.`);
      }
    } catch (error) {
      this.logger.error("Failed to connect to MongoDB", error);
      throw error;
    }
  }

  public getDatabase(): Db | undefined {
    return this.database;
  }

  public async getCollection<T = any>(collectionName: string) {
    if (!this.database) {
      await this.initialize();
    }
    return this.database!.collection<T>(collectionName);
  }

  public async shutdown(): Promise<void> {
    try {
      await this.mongoClient.close();
      this.logger.info("MongoDB connection closed successfully");
    } catch (error) {
      this.logger.error("Error closing MongoDB connection", error);
      throw error;
    }
  }
}
