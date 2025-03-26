import { Client } from "discord.js";

export abstract class Event {
  public name: string;

  constructor(name: string) {
    this.name = name;
  }

  public abstract execute(...args: any[]): Promise<void>;
  public abstract listen(client: Client): void;
}
