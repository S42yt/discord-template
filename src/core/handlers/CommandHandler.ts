import {
  ApplicationCommandDataResolvable,
  Client,
  CommandInteraction,
} from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import { Command } from "../command/Command";
import Logger from "../../util/Logger";
import * as dotenv from "dotenv";

dotenv.config();

export class CommandHandler {
  private client: Client;
  private commands: Command[] = [];
  private logger: Logger;

  constructor(client: Client) {
    this.client = client;
    this.logger = new Logger(client);

    this.client.on("interactionCreate", async (interaction) => {
      if (!interaction.isCommand()) return;

      try {
        await this.handleCommand(interaction);
      } catch (error) {
        this.logger.error("Error executing command", error);

        if (interaction.replied || interaction.deferred) {
          await interaction.editReply({
            content: "There was an error while executing this command.",
          });
        } else {
          await interaction.reply({
            content: "There was an error while executing this command.",
            ephemeral: true,
          });
        }
      }
    });
  }

  public async initialize(): Promise<void> {
    await this.registerCommands();
    await this.registerModuleCommands();
    await this.deployCommands();
  }

  public getCommands(): Command[] {
    return this.commands;
  }

  public async deployCommands(): Promise<void> {
    const guildCommands: ApplicationCommandDataResolvable[] = this.commands.map(
      (command) => command.builder.toJSON(),
    );

    const guild = this.client.guilds.cache.get(process.env.GUILD!);
    if (guild) {
      await guild.commands.set(guildCommands);
      this.logger.info("Commands successfully deployed.");
    } else {
      this.logger.error("Guild not found.");
    }
  }

  private async registerCommands(): Promise<void> {
    const commandsPath = join(__dirname, "../../commands");
    const commandFiles = readdirSync(commandsPath).filter(
      (file) => file.endsWith(".ts") || file.endsWith(".js"),
    );

    for (const file of commandFiles) {
      try {
        const commandModule = await import(join(commandsPath, file));
        const CommandClass =
          commandModule.default || Object.values(commandModule)[0];

        if (!CommandClass || typeof CommandClass !== "function") {
          this.logger.warn(`No command class found in file: ${file}`);
          continue;
        }

        const commandInstance = new CommandClass();

        if (
          !commandInstance.name ||
          !commandInstance.builder ||
          !commandInstance.execute
        ) {
          this.logger.warn(
            `The command at ${file} is missing required properties.`,
          );
          continue;
        }

        this.commands.push(commandInstance);
        this.logger.info(`Registered command: ${commandInstance.name}`);
      } catch (error) {
        this.logger.error(`Error loading command file ${file}:`, error);
      }
    }
  }

  private async registerModuleCommands(): Promise<void> {
    const modulesPath = join(__dirname, "../../modules");

    try {
      const moduleDirectories = readdirSync(modulesPath, {
        withFileTypes: true,
      })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

      for (const moduleDir of moduleDirectories) {
        const moduleCommandsPath = join(modulesPath, moduleDir, "commands");

        try {
          const commandFiles = readdirSync(moduleCommandsPath).filter(
            (file) => file.endsWith(".ts") || file.endsWith(".js"),
          );

          for (const file of commandFiles) {
            try {
              const commandModule = await import(
                join(moduleCommandsPath, file)
              );
              const CommandClass =
                commandModule.default || Object.values(commandModule)[0];

              if (!CommandClass || typeof CommandClass !== "function") {
                this.logger.warn(
                  `No command class found in module command file: ${moduleDir}/${file}`,
                );
                continue;
              }

              const commandInstance = new CommandClass();

              if (
                !commandInstance.name ||
                !commandInstance.builder ||
                !commandInstance.execute
              ) {
                this.logger.warn(
                  `The command at ${moduleDir}/${file} is missing required properties.`,
                );
                continue;
              }

              this.commands.push(commandInstance);
              this.logger.info(
                `Registered module command: ${moduleDir}/${commandInstance.name}`,
              );
            } catch (error) {
              this.logger.error(
                `Error loading module command file ${moduleDir}/${file}:`,
                error,
              );
            }
          }
        } catch (error) {
          // Skip if the commands directory doesn't exist
          if (error.code !== "ENOENT") {
            this.logger.error(
              `Error accessing module commands directory for ${moduleDir}:`,
              error,
            );
          }
        }
      }
    } catch (error) {
      this.logger.error("Error scanning modules for commands:", error);
    }
  }

  private async handleCommand(interaction: CommandInteraction): Promise<void> {
    const command = this.commands.find(
      (cmd) => cmd.name === interaction.commandName,
    );

    if (!command) {
      this.logger.warn(`No command found matching: ${interaction.commandName}`);
      return;
    }

    await command.execute(interaction);
  }
}
