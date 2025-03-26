import { login } from "./bot";
import Logger from "./util/Logger";
import { HandlerSystem } from "./core/HandlerSystem";
import "./util/MessageLogger";

process.on("uncaughtException", function (err) {
  const text = "[-] Caught exception: " + err + "\n" + err.stack;
  console.log(text);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

async function main() {
  try {
    const clientInstance = await login();
    const logger = new Logger(clientInstance);
    logger.info("Bot logged in successfully", true);

    const handlerSystem = new HandlerSystem(clientInstance);
    const initialized = await handlerSystem.initialize();

    if (initialized) {
      logger.info("Bot is fully operational", true);
    } else {
      logger.error("Bot initialization failed", null, true);
      process.exit(1);
    }

    process.on("SIGINT", async () => {
      logger.info("Shutting down bot gracefully...", true);
      await handlerSystem.shutdown();
      process.exit(0);
    });
  } catch (error) {
    console.error("Fatal error during startup:", error);
    process.exit(1);
  }
}

main();
