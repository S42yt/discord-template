import { Client, TextChannel, EmbedBuilder, Interaction } from "discord.js";
import dotenv from "dotenv";

dotenv.config();

class Logger {
  private client: Client;
  private logChannelId: string;
  private static readonly resetColor = "\x1b[0m";
  private ignoredMessages: Set<string>;

  constructor(client: Client) {
    this.client = client;
    this.logChannelId = process.env.LOG_CHANNEL_ID || "";
    this.ignoredMessages = new Set();
    this.ignoreLogs([
      "Skipping key user during hydration!",
      "Skipping key member during hydration!",
    ]);
  }

  public async log(
    message: string | EmbedBuilder,
    logToConsole: boolean = false,
  ) {
    if (typeof message === "string") {
      if (this.ignoredMessages.has(message)) return;
      if (logToConsole) {
        console.log(message);
      }
      await this.sendLogMessage(message);
    } else {
      if (logToConsole) {
        console.log(
          `Embed Log: ${message.data.title} - ${message.data.description || ""}`,
        );
      }
      await this.sendEmbed(message);
    }
  }

  public async info(message: string, logToConsole: boolean = false) {
    if (this.ignoredMessages.has(message)) return;
    const infoMessage = `Info: ${message}`;
    const greenColor = "\x1b[32m";

    if (logToConsole) {
      console.info(`${greenColor}${infoMessage}${Logger.resetColor}`);
    }
  }

  public async error(
    message: string,
    error?: any,
    logToConsole: boolean = false,
  ) {
    if (this.ignoredMessages.has(message)) return;
    const errorMessage = `Error: ${message}` + (error ? ` - ${error}` : "");
    const redColor = "\x1b[31m";

    if (logToConsole) {
      console.error(`${redColor}${errorMessage}${Logger.resetColor}`);
    }

    const embed = new EmbedBuilder()
      .setColor("#FF0000")
      .setTitle("Error")
      .setDescription(message);

    await this.sendLogMessage(errorMessage);
    await this.sendEmbed(embed);
  }

  public async warn(message: string, logToConsole: boolean = false) {
    if (this.ignoredMessages.has(message)) return;
    const warningMessage = `Warning: ${message}`;
    const yellowColor = "\x1b[33m";

    if (logToConsole) {
      console.warn(`${yellowColor}${warningMessage}${Logger.resetColor}`);
    }

    const embed = new EmbedBuilder()
      .setColor("#FFFF00")
      .setTitle("Warning")
      .setDescription(message);

    await this.sendEmbed(embed);
  }

  public async logMessage(
    messageContent: string,
    author: string,
    channel: string,
    logToConsole: boolean = false,
  ) {
    const maxFieldLength = 1024;
    const truncatedMessage =
      messageContent && messageContent.length > maxFieldLength
        ? messageContent.substring(0, maxFieldLength - 3) + "..."
        : messageContent || "No content";

    const authorValue = author || "Unknown";
    const channelValue = channel || "Unknown";

    const embed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle("Logged Message")
      .addFields([
        { name: "Author", value: authorValue, inline: true },
        { name: "Channel", value: channelValue, inline: true },
        { name: "Message", value: truncatedMessage },
      ])
      .setTimestamp();

    if (logToConsole) {
      console.log(`Logged Message: ${truncatedMessage}`);
    }

    await this.sendEmbed(embed);
  }

  public async logMessageEdit(
    oldMessageContent: string,
    newMessageContent: string,
    author: string,
    channel: string,
    logToConsole: boolean = false,
  ) {
    const maxFieldLength = 1024;
    const truncatedOldMessage =
      oldMessageContent && oldMessageContent.length > maxFieldLength
        ? oldMessageContent.substring(0, maxFieldLength - 3) + "..."
        : oldMessageContent || "No content";
    const truncatedNewMessage =
      newMessageContent && newMessageContent.length > maxFieldLength
        ? newMessageContent.substring(0, maxFieldLength - 3) + "..."
        : newMessageContent || "No content";

    const authorValue = author || "Unknown";
    const channelValue = channel || "Unknown";

    const embed = new EmbedBuilder()
      .setColor("#ffcc00")
      .setTitle("Message Edited")
      .addFields([
        { name: "Author", value: authorValue, inline: true },
        { name: "Channel", value: channelValue, inline: true },
        { name: "Old Message", value: truncatedOldMessage },
        { name: "New Message", value: truncatedNewMessage },
      ])
      .setTimestamp();

    if (logToConsole) {
      console.log(
        `Message Edited: ${truncatedOldMessage} -> ${truncatedNewMessage}`,
      );
    }

    await this.sendEmbed(embed);
  }

  public async logMessageDelete(
    messageContent: string,
    author: string,
    channel: string,
    executor?: string,
    logToConsole: boolean = false,
  ) {
    const maxFieldLength = 1024;
    const truncatedMessage =
      messageContent && messageContent.length > maxFieldLength
        ? messageContent.substring(0, maxFieldLength - 3) + "..."
        : messageContent || "No content";

    const authorValue = author || "Unknown";
    const channelValue = channel || "Unknown";
    const executorValue = executor || "Unknown";

    const embed = new EmbedBuilder()
      .setColor("#ff0000")
      .setTitle("Message Deleted")
      .addFields([
        { name: "Author", value: authorValue, inline: true },
        { name: "Channel", value: channelValue, inline: true },
        { name: "Message", value: truncatedMessage },
        { name: "Deleted by", value: executorValue, inline: true },
      ])
      .setTimestamp();

    if (logToConsole) {
      console.log(`Message Deleted: ${truncatedMessage}`);
    }

    await this.sendEmbed(embed);
  }

  public async logSlashCommand(interaction: Interaction) {
    if (interaction.isCommand()) {
      const commandName = interaction.commandName;
      const user = interaction.user.tag;
      const channel = interaction.channel?.id;
      if (channel) {
        await this.logMessage(
          `Slash command executed: ${commandName}`,
          user,
          channel,
          true,
        );
      } else {
        console.warn("Channel not found for interaction.");
      }
    }
  }

  private async sendEmbed(embed: EmbedBuilder) {
    const channel = await this.getLogChannel();
    if (channel) {
      await channel.send({ embeds: [embed] });
    }
  }

  private async sendLogMessage(message: string) {
    const channel = await this.getLogChannel();
    if (channel) {
      await channel.send(message);
    }
  }

  public async getLogChannel(): Promise<TextChannel | null> {
    if (!this.logChannelId) return null;
    const channel = await this.client.channels.fetch(this.logChannelId);
    return channel instanceof TextChannel ? channel : null;
  }

  public ignoreLogs(messages: string[]) {
    messages.forEach((message) => this.ignoredMessages.add(message));
  }
}

export default Logger;
