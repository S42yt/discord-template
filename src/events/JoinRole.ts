import { Client, GuildMember } from "discord.js";
import { Event } from "../core/event/Event";
import dotenv from "dotenv";

dotenv.config();

export default class JoinRole implements Event {
  public name = "guildMemberAdd";

  public async execute(
    client: Client<boolean>,
    member: GuildMember,
  ): Promise<void> {
    const role = member.guild.roles.cache.find(
      (r) => r.name === process.env.JOIN_ROLE,
    );
    if (role) {
      await member.roles.add(role);
    }
  }

  public listen(client: Client): void {
    client.on(this.name, async (member: GuildMember) => {
      await this.execute(client, member);
    });
  }
}
