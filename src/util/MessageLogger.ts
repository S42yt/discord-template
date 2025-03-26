import {
  Message,
  EmbedBuilder,
  TextChannel,
  AuditLogEvent,
  Interaction,
  userMention,
} from "discord.js";
import Logger from "./Logger";
import client from "../bot";
import dotenv from "dotenv";
dotenv.config();

const logger = new Logger(client);
const logChannelId = process.env.LOG_CHAT!;
const excludedChannels = new Set<string>(["", ""]);

// Listen for slash commands
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  await MessageLogger.logSlashCommand(logger, interaction);
});

client.on("messageCreate", async (message) => {
  if (
    excludedChannels.has(message.channel.id) ||
    !message.author ||
    message.author.bot ||
    message.channel.id === logChannelId
  )
    return;
  await MessageLogger.logMessage(logger, message);
});

client.on("messageUpdate", async (oldMessage, newMessage) => {
  if (
    excludedChannels.has(oldMessage.channel.id) ||
    excludedChannels.has(newMessage.channel.id) ||
    !oldMessage.author ||
    oldMessage.author.bot ||
    !newMessage.author ||
    newMessage.author.bot ||
    oldMessage.channel.id === logChannelId ||
    newMessage.channel.id === logChannelId
  )
    return;
  if (oldMessage.partial) {
    try {
      await oldMessage.fetch();
    } catch {
      logger.warn("Old message content is unavailable.", true);
      return;
    }
  }
  if (newMessage.partial) {
    try {
      await newMessage.fetch();
    } catch {
      logger.warn("New message content is unavailable.", true);
      return;
    }
  }
  const fullOldMessage = oldMessage as Message;
  const fullNewMessage = newMessage as Message;
  await MessageLogger.logMessageEdit(logger, fullOldMessage, fullNewMessage);
  logger.log(
    `Message edited in <#${fullOldMessage.channel.id}> by <@${fullOldMessage.author.id}>: ${fullOldMessage.content} -> ${fullNewMessage.content}`,
    true,
  );
});

client.on("messageDelete", async (message) => {
  if (
    excludedChannels.has(message.channel.id) ||
    !message.author ||
    message.author.bot ||
    message.channel.id === logChannelId
  )
    return;
  if (message.partial) {
    logger.warn(
      "Message content is unavailable (likely was not cached).",
      true,
    );
    return;
  }
  await MessageLogger.logMessageDelete(logger, message as Message);
});

class MessageLogger {
  static async logSlashCommand(logger: Logger, interaction: Interaction) {
    if (!interaction.isChatInputCommand()) return;
    const commandName = interaction.commandName;
    const channelId = interaction.channel?.id || "Unknown";
    const userMention = `<@${interaction.user.id}>`;
    const logMsg = `Slash command executed: /${commandName} by ${userMention} in <#${channelId}>`;
    logger.log(logMsg, true);

    const embed = new EmbedBuilder()
      .setTitle("Slash Command Executed")
      .setDescription(`**Command:** /${commandName}\n**User:** ${userMention}`)
      .addFields({
        name: "Channel",
        value: channelId !== "Unknown" ? `<#${channelId}>` : "Unknown",
        inline: true,
      })
      .setColor("Blue")
      .setTimestamp();

    const logChannel = client.channels.cache.get(logChannelId) as TextChannel;
    if (logChannel) {
      await logChannel.send({ embeds: [embed] });
    }
  }

  static async logMessage(logger: Logger, message: Message) {
    let content = message.content;

    if (message.stickers.size > 0) {
      content += "\nStickers: ";
      message.stickers.forEach((sticker) => {
        content += `${sticker.name} `;
      });
    }

    if (message.attachments.size > 0) {
      const attachmentLinks = Array.from(message.attachments.values()).map(
        (attachment) => attachment.url,
      );
      content += "\nAttachments:\n" + attachmentLinks.join("\n");
    }

    const logMessage = `Message in <#${message.channel.id}> by <@${message.author.id}>: ${content}`;
    logger.log(logMessage, true);
    await logger.logMessage(
      content,
      message.author.tag,
      message.channel.id,
      true,
    );

    const embed = new EmbedBuilder()
      .setTitle("Message Created")
      .setDescription(content)
      .addFields({
        name: "Channel",
        value: `<#${message.channel.id}>`,
        inline: true,
      })
      .addFields({
        name: "User",
        value: `<@${message.author.id}>`,
        inline: true,
      })
      .setThumbnail(message.member?.user.avatarURL() || "")
      .setColor("Green")
      .setTimestamp();

    const logChannel = client.channels.cache.get(logChannelId!) as TextChannel;
    if (logChannel) {
      await logChannel.send({ embeds: [embed] });
    }
  }

  static async logMessageEdit(
    logger: Logger,
    oldMessage: Message,
    newMessage: Message,
  ) {
    let oldContent = oldMessage.content;
    let newContent = newMessage.content;

    if (oldMessage.attachments.size > 0) {
      const oldAttachments = Array.from(oldMessage.attachments.values()).map(
        (attachment) => attachment.url,
      );
      oldContent += "\nAttachments (Before):\n" + oldAttachments.join("\n");
    }

    if (newMessage.attachments.size > 0) {
      const newAttachments = Array.from(newMessage.attachments.values()).map(
        (attachment) => attachment.url,
      );
      newContent += "\nAttachments (After):\n" + newAttachments.join("\n");
    }

    const logMessage = `Message edited in <#${oldMessage.channel.id}> by <@${oldMessage.author.id}>:\n**Before:** ${oldContent}\n**After:** ${newContent}`;
    logger.log(logMessage, true);
    await logger.logMessageEdit(
      oldContent,
      newContent,
      oldMessage.author.tag,
      oldMessage.channel.id,
      true,
    );

    const embed = new EmbedBuilder()
      .setTitle("Message Edited")
      .setDescription(`**Before:** ${oldContent}\n**After:** ${newContent}`)
      .addFields({
        name: "Channel",
        value: `<#${oldMessage.channel.id}>`,
        inline: true,
      })
      .addFields({
        name: "User",
        value: `<@${oldMessage.author.id}>`,
        inline: true,
      })
      .setThumbnail(oldMessage.member?.user.avatarURL() || "")
      .setColor("Orange")
      .setTimestamp();

    const logChannel = client.channels.cache.get(logChannelId) as TextChannel;
    if (logChannel) {
      await logChannel.send({ embeds: [embed] });
    }
  }

  static async logMessageDelete(logger: Logger, message: Message) {
    let content = message.content;

    if (message.attachments.size > 0) {
      const attachmentLinks = Array.from(message.attachments.values()).map(
        (attachment) => attachment.url,
      );
      content += "\nAttachments:\n" + attachmentLinks.join("\n");
    }

    const logMessage = `Message deleted in <#${message.channel.id}> by <@${message.author.id}>:\n${content}`;
    logger.log(logMessage, true);
    const auditLogs = await message.guild?.fetchAuditLogs({
      type: AuditLogEvent.MessageDelete,
      limit: 1,
    });
    const deletionLog = auditLogs?.entries.first();
    const executor = deletionLog?.executor?.tag || "Unknown";

    await logger.logMessageDelete(
      content,
      message.author.tag,
      message.channel.id,
      executor,
      true,
    );

    const embed = new EmbedBuilder()
      .setTitle("Message Deleted")
      .setDescription(content || "No content")
      .addFields({
        name: "Channel",
        value: `<#${message.channel.id}>`,
        inline: true,
      })
      .addFields({
        name: "User",
        value: `<@${message.author.id}>`,
        inline: true,
      })
      .addFields({ name: "Deleted by", value: executor, inline: true })
      .setThumbnail(message.member?.user.avatarURL() || "")
      .setColor("Red")
      .setTimestamp();

    const logChannel = client.channels.cache.get(logChannelId) as TextChannel;
    if (logChannel) {
      await logChannel.send({ embeds: [embed] });
    }
  }
}

export default MessageLogger;
