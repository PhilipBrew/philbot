const {
  handleAddSong,
  play,
  skip,
  handleJoinChannel,
  handleShowQueue,
} = require("./audioBot");

const shouldReadMessage = (msg) => msg.startsWith(process.env.BOT_PREFIX);

const getSanitisedCommand = (msg) =>
  msg
    .substring(process.env.BOT_PREFIX.length)
    .trim()
    .split(" ")[0]
    .toLowerCase();

const handleCommand = (PhilBot, msg, command) => {
  switch (command) {
    case "play":
      PhilBot.handleJoinChannel(msg);
      PhilBot.handleAddSong(msg);
      return;
    case "help":
      msg.channel.send(`AHAHAHA ${msg.author.username} needs help... weak`);
      return;
    case "queue":
      PhilBot.handleShowQueue(msg);
      return;
    case "skip":
      PhilBot.skip(msg);
      return;
    case "stop" || "clear":
      PhilBot.stop();
      return;
    case "pause":
      PhilBot.pause();
      return;
    case "resume":
      PhilBot.resume();
      return;
    default:
      msg.reply(
        `Listen here you little shit, '${command}' is not a recognised command - ya dafty`
      );
      return;
  }
};

const getUrlFromCommand = async (command) =>
  command
    .substring(process.env.BOT_PREFIX.length)
    .trim()
    .split(" ")[1]
    .toString();

const formatSecondsToTime = (seconds) => {
  const numberSeconds = parseInt(seconds);
  let formattedTime = new Date(numberSeconds * 1000).toISOString();
  if (numberSeconds < 3600) formattedTime = formattedTime.substr(14, 5);
  else formattedTime = formattedTime.substr(11, 8);

  return formattedTime;
};

module.exports = {
  getUrlFromCommand,
  formatSecondsToTime,
  shouldReadMessage,
  getSanitisedCommand,
  handleCommand,
};
