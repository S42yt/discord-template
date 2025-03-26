import { CommandInteraction, SlashCommandBuilder } from "discord.js";

export interface Command {
  name: string;
  builder: SlashCommandBuilder;
  execute(interaction: CommandInteraction): Promise<void>;
}
