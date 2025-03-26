import {
  SlashCommandBuilder,
  CommandInteraction,
  PermissionFlagsBits,
  GuildMember,
  ChannelType,
} from "discord.js";
import { Command } from "../../../core/command/Command";

export class VoiceCommand implements Command {
  name = "voice";
  builder = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription("Manage your voice channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("invite")
        .setDescription("Invite a user to your private voice channel")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to invite")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("kick")
        .setDescription("Remove a user from your private voice channel")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to remove")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("limit")
        .setDescription("Set a user limit for your voice channel")
        .addIntegerOption((option) =>
          option
            .setName("count")
            .setDescription("The maximum number of users (0 for unlimited)")
            .setRequired(true)
            .setMinValue(0)
            .setMaxValue(99),
        ),
    );

  async execute(interaction: CommandInteraction): Promise<void> {
    if (!interaction.inGuild()) {
      await interaction.reply({
        content: "This command can only be used in a server.",
        ephemeral: true,
      });
      return;
    }

    const member = interaction.member as GuildMember;

    if (!member.voice.channel) {
      await interaction.reply({
        content: "You need to be in a voice channel to use this command.",
        ephemeral: true,
      });
      return;
    }

    const voiceChannel = member.voice.channel;

    // Check if the user has permissions to manage the channel
    const hasPermission = voiceChannel
      .permissionsFor(member)
      ?.has(PermissionFlagsBits.ManageChannels);

    if (!hasPermission) {
      await interaction.reply({
        content: "You don't have permission to manage this voice channel.",
        ephemeral: true,
      });
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case "invite":
        const userToInvite = interaction.options.getUser("user");

        if (!userToInvite) {
          await interaction.reply({
            content: "User not found.",
            ephemeral: true,
          });
          return;
        }

        try {
          await voiceChannel.permissionOverwrites.create(userToInvite, {
            Connect: true,
            ViewChannel: true,
          });

          await interaction.reply({
            content: `Successfully invited ${userToInvite.toString()} to your voice channel.`,
            ephemeral: true,
          });
        } catch (error) {
          await interaction.reply({
            content: "Failed to invite user to your voice channel.",
            ephemeral: true,
          });
        }
        break;

      case "kick":
        const userToKick = interaction.options.getUser("user");

        if (!userToKick) {
          await interaction.reply({
            content: "User not found.",
            ephemeral: true,
          });
          return;
        }

        const memberToKick = interaction.guild?.members.cache.get(
          userToKick.id,
        );

        if (!memberToKick) {
          await interaction.reply({
            content: "Member not found in this server.",
            ephemeral: true,
          });
          return;
        }

        // Don't allow kicking yourself
        if (memberToKick.id === member.id) {
          await interaction.reply({
            content: "You cannot kick yourself from the channel.",
            ephemeral: true,
          });
          return;
        }

        try {
          // Set deny permission and disconnect if in the channel
          await voiceChannel.permissionOverwrites.create(userToKick, {
            Connect: false,
          });

          if (memberToKick.voice.channelId === voiceChannel.id) {
            await memberToKick.voice.disconnect("Kicked from voice channel");
          }

          await interaction.reply({
            content: `Successfully removed ${userToKick.toString()} from your voice channel.`,
            ephemeral: true,
          });
        } catch (error) {
          await interaction.reply({
            content: "Failed to remove user from your voice channel.",
            ephemeral: true,
          });
        }
        break;

      case "limit":
        const limit = interaction.options.getInteger("count", true);

        try {
          await voiceChannel.setUserLimit(limit);

          const limitMessage =
            limit === 0
              ? "User limit removed from your voice channel."
              : `User limit set to ${limit} for your voice channel.`;

          await interaction.reply({ content: limitMessage, ephemeral: true });
        } catch (error) {
          await interaction.reply({
            content: "Failed to set user limit for your voice channel.",
            ephemeral: true,
          });
        }
        break;

      default:
        await interaction.reply({
          content: "Unknown subcommand.",
          ephemeral: true,
        });
    }
  }
}
