import { Client } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import { Event } from "../event/Event";
import Logger from "../../util/Logger";

export class EventHandler {
  private client: Client;
  private events: Event[] = [];
  private logger: Logger;

  constructor(client: Client) {
    this.client = client;
    this.logger = new Logger(client);
  }

  public async initialize(): Promise<void> {
    await this.registerEvents();
    await this.registerModuleEvents();
    await this.deployEvents();
  }

  private async registerEvents(): Promise<void> {
    const eventsPath = join(__dirname, "../../events");

    try {
      const eventFiles = readdirSync(eventsPath).filter(
        (file) => file.endsWith(".ts") || file.endsWith(".js"),
      );

      for (const file of eventFiles) {
        try {
          const eventModule = await import(join(eventsPath, file));
          const EventClass =
            eventModule.default || Object.values(eventModule)[0];

          if (!EventClass || typeof EventClass !== "function") {
            this.logger.warn(`No event class found in file: ${file}`);
            continue;
          }

          const eventInstance = new EventClass();

          if (
            !eventInstance.name ||
            !eventInstance.execute ||
            !eventInstance.listen
          ) {
            this.logger.warn(
              `The event at ${file} is missing required properties.`,
            );
            continue;
          }

          this.events.push(eventInstance);
          this.logger.info(`Registered event: ${eventInstance.name}`);
        } catch (error) {
          this.logger.error(`Error loading event file ${file}:`, error);
        }
      }
    } catch (error) {
      this.logger.error("Error accessing events directory:", error);
    }
  }

  private async registerModuleEvents(): Promise<void> {
    const modulesPath = join(__dirname, "../../modules");

    try {
      const moduleDirectories = readdirSync(modulesPath, {
        withFileTypes: true,
      })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

      for (const moduleDir of moduleDirectories) {
        const moduleEventsPath = join(modulesPath, moduleDir, "events");

        try {
          const eventFiles = readdirSync(moduleEventsPath).filter(
            (file) => file.endsWith(".ts") || file.endsWith(".js"),
          );

          for (const file of eventFiles) {
            try {
              const eventModule = await import(join(moduleEventsPath, file));
              const EventClass =
                eventModule.default || Object.values(eventModule)[0];

              if (!EventClass || typeof EventClass !== "function") {
                this.logger.warn(
                  `No event class found in module event file: ${moduleDir}/${file}`,
                );
                continue;
              }

              const eventInstance = new EventClass();

              if (
                !eventInstance.name ||
                !eventInstance.execute ||
                !eventInstance.listen
              ) {
                this.logger.warn(
                  `The event at ${moduleDir}/${file} is missing required properties.`,
                );
                continue;
              }

              this.events.push(eventInstance);
              this.logger.info(
                `Registered module event: ${moduleDir}/${eventInstance.name}`,
              );
            } catch (error) {
              this.logger.error(
                `Error loading module event file ${moduleDir}/${file}:`,
                error,
              );
            }
          }
        } catch (error) {
          // Skip if the events directory doesn't exist
          if (error.code !== "ENOENT") {
            this.logger.error(
              `Error accessing module events directory for ${moduleDir}:`,
              error,
            );
          }
        }
      }
    } catch (error) {
      this.logger.error("Error scanning modules for events:", error);
    }
  }

  public async deployEvents(): Promise<void> {
    for (const event of this.events) {
      try {
        this.logger.info(`Deploying event: ${event.name}`);
        event.listen(this.client);
      } catch (error) {
        this.logger.error(`Error deploying event ${event.name}:`, error);
      }
    }
    this.logger.info("All events deployed successfully.");
  }

  public getEvents(): Event[] {
    return this.events;
  }

  public getEvent(name: string): Event | undefined {
    return this.events.find((event) => event.name === name);
  }
}
