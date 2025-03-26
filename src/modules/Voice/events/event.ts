import { Client, VoiceChannel } from "discord.js";
import { Event } from "../../../core/event/Event";
import Logger from "../../../util/Logger";

export default class VoiceChannelDelete extends Event {
  private logger: Logger;

  constructor() {
    super("channelDelete");
    this.logger = new Logger(null!);
  }

  public async execute(
    client: Client<boolean>,
    channel: VoiceChannel,
  ): Promise<void> {
    this.logger = new Logger(client);

    if (channel.type !== 2) return;

    this.logger.info(`Voice channel deleted: ${channel.name} (${channel.id})`);
  }

  public listen(client: Client): void {
    client.on(this.name, async (channel) => {
      if (channel.type === 2) {
        await this.execute(client, channel as VoiceChannel);
      }
    });
  }
}
