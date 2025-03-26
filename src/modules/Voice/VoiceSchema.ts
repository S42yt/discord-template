import { Document } from "mongodb";

export interface VoiceData extends Document {
  userId: string;
  guildId: string;
  channelSettings?: {
    name?: string;
    userLimit?: number;
    isPrivate: boolean;
    allowedUsers?: string[];
  };
  statistics?: {
    totalTimeInVoice: number;
    lastJoined?: Date;
    lastLeft?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface VoiceChannelSettings {
  id: string;
  name: string;
  category: string | null;
  isGenerator: boolean;
  isTemporary: boolean;
  ownerId?: string;
  guildId: string;
  createdAt: Date;
}
