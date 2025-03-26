import { Client } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import Logger from "../../util/Logger";

export interface BotModule {
  initialize(): Promise<void>;
  shutdown?(): Promise<void>;
}

export class ModuleHandler {
  private client: Client;
  private modules: Map<string, BotModule> = new Map();
  private logger: Logger;

  constructor(client: Client) {
    this.client = client;
    this.logger = new Logger(client);
  }

  public async initialize(): Promise<void> {
    await this.registerModules();
  }

  private async registerModules(): Promise<void> {
    const modulesPath = join(__dirname, "../../modules");

    try {
      // Check if modules directory exists
      const moduleDirectories = readdirSync(modulesPath, {
        withFileTypes: true,
      })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

      for (const moduleDir of moduleDirectories) {
        try {
          const modulePath = join(modulesPath, moduleDir);

          // First try to import the index.ts/js file
          try {
            const indexPath = join(modulePath, "index");
            const moduleExport = await import(indexPath);

            // Get the default export or the first export
            const ModuleClass =
              moduleExport.default || Object.values(moduleExport)[0];

            if (!ModuleClass || typeof ModuleClass !== "function") {
              this.logger.warn(
                `No valid module class found in index file for module: ${moduleDir}`,
              );
              continue;
            }

            const moduleInstance = new ModuleClass(this.client);

            if (typeof moduleInstance.initialize !== "function") {
              this.logger.warn(
                `Module ${moduleDir} does not have an initialize method`,
              );
              continue;
            }

            await moduleInstance.initialize();
            this.modules.set(moduleDir, moduleInstance);
            this.logger.info(`Registered and initialized module: ${moduleDir}`);
          } catch (indexError) {
            // If index.ts/js fails, try to find any *Module.ts/js file as fallback
            this.logger.warn(
              `Error loading index file for module ${moduleDir}: ${indexError}`,
            );
            const moduleFiles = readdirSync(modulePath).filter(
              (file) =>
                file.endsWith("Module.ts") || file.endsWith("Module.js"),
            );

            if (moduleFiles.length === 0) {
              this.logger.warn(`No module file found for ${moduleDir}`);
              continue;
            }

            // Use the first module file found
            const moduleFile = moduleFiles[0];
            const moduleExport = await import(join(modulePath, moduleFile));
            const ModuleClass =
              moduleExport.default || Object.values(moduleExport)[0];

            if (!ModuleClass || typeof ModuleClass !== "function") {
              this.logger.warn(
                `No valid module class found in file: ${moduleFile}`,
              );
              continue;
            }

            const moduleInstance = new ModuleClass(this.client);

            if (typeof moduleInstance.initialize !== "function") {
              this.logger.warn(
                `Module ${moduleDir} does not have an initialize method`,
              );
              continue;
            }

            await moduleInstance.initialize();
            this.modules.set(moduleDir, moduleInstance);
            this.logger.info(
              `Registered and initialized module (fallback): ${moduleDir}`,
            );
          }
        } catch (error) {
          this.logger.error(`Error loading module ${moduleDir}:`, error);
        }
      }

      if (this.modules.size === 0) {
        this.logger.warn("No modules were found or loaded.");
      } else {
        this.logger.info(
          `${this.modules.size} modules successfully registered and initialized.`,
        );
      }
    } catch (error) {
      this.logger.warn("Modules directory not found or error loading modules");
    }
  }

  public getModules(): Map<string, BotModule> {
    return this.modules;
  }

  public getModule(name: string): BotModule | undefined {
    return this.modules.get(name);
  }

  public async shutdown(): Promise<void> {
    for (const [name, module] of this.modules.entries()) {
      if (typeof module.shutdown === "function") {
        try {
          await module.shutdown();
          this.logger.info(`Module ${name} shut down successfully`);
        } catch (error) {
          this.logger.error(`Error shutting down module ${name}`, error);
        }
      }
    }
    this.logger.info("All modules shut down successfully");
  }
}
