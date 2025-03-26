import {
  SlashCommandBuilder,
  CommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { Command } from "../core/command/Command";
import { connectDatabase } from "../core/database/Database";

export class PingCommand implements Command {
  name = "ping";
  builder = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription("Pingt den Bot und die Datenbank")
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages);

  async execute(interaction: CommandInteraction): Promise<void> {
    const loadingEmbed = new EmbedBuilder()
      .setColor(0xffff00)
      .setTitle("Pinging...")
      .setDescription("Der Bot und die Datenbank werden gepingt.");

    await interaction.reply({ embeds: [loadingEmbed], ephemeral: true });

    try {
      const start = Date.now();
      await connectDatabase();
      const dbPing = Date.now() - start;

      const botPing = Date.now() - interaction.createdTimestamp;

      const successEmbed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle("Ping erfolgreich")
        .addFields(
          {
            name: "Bot Ping",
            value: `${botPing}ms`,
            inline: true,
          },
          { name: "DB Ping", value: `${dbPing}ms`, inline: true },
        );

      await interaction.editReply({ embeds: [successEmbed] });
    } catch (error) {
      const errorEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("Ping fehlgeschlagen")
        .setDescription("Der Bot konnte die Datenbank nicht erreichen.");

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  }
}
