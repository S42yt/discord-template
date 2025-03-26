import { Client } from "discord.js";
import { VoiceSystem } from "./VoiceSystem";
import { BotModule } from "../../core/handlers/ModuleHandler";
import Logger from "../../util/Logger";

export class VoiceModule implements BotModule {
  private client: Client;
  private voiceSystem: VoiceSystem;
  private logger: Logger;

  constructor(client: Client) {
    this.client = client;
    this.logger = new Logger(client);
    this.voiceSystem = new VoiceSystem(client);
  }

  public async initialize(): Promise<void> {
    try {
      this.logger.info("Initializing Voice module...");

      await this.voiceSystem.initialize();

      this.registerListeners();

      this.logger.info("Voice module initialized successfully");
    } catch (error) {
      this.logger.error("Failed to initialize Voice module", error);
      throw error;
    }
  }

  private registerListeners(): void {
    this.client.on("voiceStateUpdate", (oldState, newState) => {
      this.voiceSystem
        .handleVoiceStateUpdate(oldState, newState)
        .catch((error) => {
          this.logger.error("Error handling voice state update", error);
        });
    });
  }

  public async shutdown(): Promise<void> {
    try {
      await this.voiceSystem.cleanup();
      this.logger.info("Voice module shut down successfully");
    } catch (error) {
      this.logger.error("Error shutting down Voice module", error);
    }
  }
}

export default VoiceModule;
