require("dotenv").config();
const { Client, Intents } = require("discord.js");
const { AudioBot } = require("./src/audioBot");
const {
  shouldReadMessage,
  getSanitisedCommand,
  handleCommand,
} = require("./src/functions");

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_VOICE_STATES,
  ],
});

const queue = new Map();

const PhilBot = new AudioBot(
  "command",
  null,
  queue,
  "voiceChannel",
  "connection",
  "player"
);

client.on("ready", () => {
  console.log("Phil Bot Ready");
});

client.on("message", (msg) => {
  const { content } = msg;
  const serverQueue = queue.get(msg.guild.id);

  if (shouldReadMessage(content)) {
    const command = getSanitisedCommand(content);
    handleCommand(PhilBot, msg, serverQueue, command);
  }
  return;
});

client.login(process.env.BOT_TOKEN);
