import { ActivityType, Client, GatewayIntentBits, Partials } from "discord.js";
import * as dotenv from "dotenv";
import Logger from "./util/Logger";

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.DirectMessageTyping,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildScheduledEvents,
  ],
  partials: [
    Partials.Message,
    Partials.Reaction,
    Partials.Channel,
    Partials.GuildMember,
    Partials.User,
  ],
});

const logger = new Logger(client);

export function login(): Promise<Client> {
  return new Promise((resolve) => {
    client.once("ready", async () => {
      logger.log(`Der bot ist eingeloggt als ${client.user?.tag}`, true);
      displayPresence(client);
      resolve(client);
    });

    client.login(process.env.TOKEN);
  });
}

function displayPresence(client: Client) {
  client.user?.setPresence({
    activities: [
      {
        name: "Placeholder",
        type: ActivityType.Watching,
        state: "Placeholder!",
      },
    ],
    status: "online",
  });
}

export default client;
