import {
  Client,
  VoiceState,
  Collection,
  Guild,
  GuildMember,
  VoiceChannel,
} from "discord.js";
import { VoiceData } from "./VoiceSchema";
import Logger from "../../util/Logger";
import cacheManager from "../../core/cache/Cache";

export class VoiceSystem {
  private client: Client;
  private logger: Logger;
  private voiceCache: Collection<string, VoiceData> = new Collection();
  private temporaryChannels: Set<string> = new Set();

  constructor(client: Client) {
    this.client = client;
    this.logger = new Logger(client);
  }

  public async initialize(): Promise<void> {
    try {
      const cache = cacheManager.createEntityCache<VoiceData>({
        ttl: 3600,
        collectionName: "voiceData",
      });

      await this.loadInitialData();

      this.logger.info("Voice system initialized successfully");
    } catch (error) {
      this.logger.error("Error initializing voice system", error);
      throw error;
    }
  }

  private async loadInitialData(): Promise<void> {}

  public async handleVoiceStateUpdate(
    oldState: VoiceState,
    newState: VoiceState,
  ): Promise<void> {
    try {
      if (!oldState.channelId && newState.channelId) {
        await this.handleMemberJoinVoice(newState);
      } else if (oldState.channelId && !newState.channelId) {
        await this.handleMemberLeaveVoice(oldState);
      } else if (
        oldState.channelId &&
        newState.channelId &&
        oldState.channelId !== newState.channelId
      ) {
        await this.handleMemberMoveVoice(oldState, newState);
      }
    } catch (error) {
      this.logger.error("Error in voice state handler", error);
    }
  }

  private async handleMemberJoinVoice(state: VoiceState): Promise<void> {
    if (!state.channel) return;

    const createChannelId = process.env.CREATE_VOICE_CHANNEL_ID;
    if (createChannelId && state.channelId === createChannelId) {
      await this.createPrivateVoiceChannel(state.member!, state.guild);
    }
  }

  private async handleMemberLeaveVoice(state: VoiceState): Promise<void> {
    if (!state.channel) return;

    if (
      this.temporaryChannels.has(state.channelId) &&
      state.channel.members.size === 0
    ) {
      try {
        await state.channel.delete("Voice channel empty");
        this.temporaryChannels.delete(state.channelId);
        this.logger.info(
          `Deleted empty temporary voice channel: ${state.channel.name}`,
        );
      } catch (error) {
        this.logger.error(
          `Error deleting voice channel: ${state.channel.id}`,
          error,
        );
      }
    }
  }

  private async handleMemberMoveVoice(
    oldState: VoiceState,
    newState: VoiceState,
  ): Promise<void> {
    await this.handleMemberLeaveVoice(oldState);
    await this.handleMemberJoinVoice(newState);
  }

  private async createPrivateVoiceChannel(
    member: GuildMember,
    guild: Guild,
  ): Promise<VoiceChannel | null> {
    try {
      const voiceCategory = process.env.VOICE_CATEGORY_ID;

      if (!voiceCategory) {
        this.logger.warn("Voice category ID not configured");
        return null;
      }

      const channel = await guild.channels.create({
        name: `${member.displayName}'s Channel`,
        type: 2,
        parent: voiceCategory,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: ["Connect"],
          },
          {
            id: member.id,
            allow: [
              "Connect",
              "ManageChannels",
              "MuteMembers",
              "DeafenMembers",
            ],
          },
        ],
      });

      this.temporaryChannels.add(channel.id);
      this.logger.info(
        `Created private voice channel for ${member.displayName}`,
      );

      await member.voice.setChannel(channel);

      return channel as VoiceChannel;
    } catch (error) {
      this.logger.error(
        `Error creating private voice channel for ${member.displayName}`,
        error,
      );
      return null;
    }
  }

  public async cleanup(): Promise<void> {
    try {
      const promises = Array.from(this.temporaryChannels).map(
        async (channelId) => {
          const channel = this.client.channels.cache.get(
            channelId,
          ) as VoiceChannel;
          if (channel) {
            try {
              await channel.delete("Bot shutting down");
              this.logger.info(
                `Deleted temporary voice channel during cleanup: ${channel.name}`,
              );
            } catch (error) {
              this.logger.error(
                `Error deleting voice channel during cleanup: ${channelId}`,
                error,
              );
            }
          }
        },
      );

      await Promise.all(promises);
      this.temporaryChannels.clear();
      this.logger.info("Voice system cleanup completed");
    } catch (error) {
      this.logger.error("Error in voice system cleanup", error);
    }
  }
}
