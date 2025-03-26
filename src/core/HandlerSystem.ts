import { Client } from "discord.js";
import { CommandHandler } from "./handlers/CommandHandler";
import { EventHandler } from "./handlers/EventHandler";
import { ModuleHandler } from "./handlers/ModuleHandler";
import { DatabaseHandler } from "./handlers/DatabaseHandler";
import Logger from "../util/Logger";

export class HandlerSystem {
  private client: Client;
  private commandHandler: CommandHandler;
  private eventHandler: EventHandler;
  private moduleHandler: ModuleHandler;
  private databaseHandler: DatabaseHandler;
  private logger: Logger;

  constructor(client: Client) {
    this.client = client;
    this.logger = new Logger(client);

    this.databaseHandler = new DatabaseHandler(client);
    this.commandHandler = new CommandHandler(client);
    this.eventHandler = new EventHandler(client);
    this.moduleHandler = new ModuleHandler(client);
  }

  public async initialize(): Promise<boolean> {
    try {
      await this.databaseHandler.initialize();
      this.logger.info("Database connection established successfully.", true);

      await this.eventHandler.initialize();
      this.logger.log(
        `${this.eventHandler.getEvents().length} Events were loaded!`,
        true,
      );

      await this.commandHandler.initialize();
      this.logger.log(
        `${this.commandHandler.getCommands().length} Commands were loaded!`,
        true,
      );

      await this.moduleHandler.initialize();
      this.logger.log(
        `${this.moduleHandler.getModules().size} Modules were loaded!`,
        true,
      );

      return true;
    } catch (error) {
      this.logger.error("Failed to initialize handler system", error, true);
      return false;
    }
  }

  public getCommandHandler(): CommandHandler {
    return this.commandHandler;
  }

  public getEventHandler(): EventHandler {
    return this.eventHandler;
  }

  public getModuleHandler(): ModuleHandler {
    return this.moduleHandler;
  }

  public getDatabaseHandler(): DatabaseHandler {
    return this.databaseHandler;
  }

  public async shutdown(): Promise<void> {
    try {
      await this.moduleHandler.shutdown();
      await this.databaseHandler.shutdown();
      this.logger.info("Handler system shut down successfully", true);
    } catch (error) {
      this.logger.error("Error during shutdown", error, true);
    }
  }
}
