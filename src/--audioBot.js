const ytdl = require("ytdl-core");
const {
  // joinVoiceChannel,
  entersState,
  VoiceConnectionStatus,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
} = require("@discordjs/voice");

class AudioBot {
  constructor(
    msg,
    command,
    serverQueue,
    queue,
    voiceChannel,
    connection,
    player
  ) {
    this.msg = msg;
    this.command = command;
    this.serverQueue = serverQueue;
    this.queue = queue;
    this.voiceChannel = voiceChannel;
    this.connection = connection;
    this.player = player;
  }

  handleJoinChannel() {
    const { voiceChannel, msg } = this;
    voiceChannel = msg.member.voice.channel;
    // If the user doing the command is not part of a voice channel
    if (!voiceChannel) {
      msg.reply(`You're not even in a voice channel you fucking tool`);
      return;
    }

    const permissions = voiceChannel.permissionsFor(msg.client.user);
    // Do we have the correct permissions to connect to and speak in the voice channel
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
      msg.channel.send(
        "I don't even have the right permissions to join and speak in the channel... Fucks sake"
      );
      return;
    }
  }
}

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

// const handleJoinChannel = (msg, voiceChannel) => {
//   voiceChannel = msg.member.voice.channel;
//   // If the user doing the command is not part of a voice channel
//   if (!voiceChannel) {
//     msg.reply(`You're not even in a voice channel you fucking tool`);
//     return;
//   }

//   const permissions = voiceChannel.permissionsFor(msg.client.user);
//   // Do we have the correct permissions to connect to and speak in the voice channel
//   if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
//     msg.channel.send(
//       "I don't even have the right permissions to join and speak in the channel... Fucks sake"
//     );
//     return;
//   }
// };

const handleAddSong = async (
  msg,
  serverQueue,
  queue,
  voiceChannel,
  connection,
  player
) => {
  const urlToDecode = await getUrlFromCommand(msg.content);

  const songInfo = await ytdl.getInfo(urlToDecode);
  const song = {
    title: songInfo.videoDetails.title,
    url: songInfo.videoDetails.video_url,
    length: songInfo.videoDetails.lengthSeconds,
  };

  msg.reply(`You should now be hearing: ${song.title}`);

  if (!serverQueue) {
    const queueConstruct = {
      textChannel: msg.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: 5,
      playing: true,
    };

    queue.set(msg.guild.id, queueConstruct);

    queueConstruct.songs.push(song);

    try {
      await connectToChannel(
        msg.member.voice.channel,
        song,
        connection,
        player
      );
    } catch (err) {
      console.error("ERROR1 ------>", err);
      queue.delete(msg.guild.id);
      return msg.channel.send(err);
    }
  } else {
    serverQueue.songs.push(song);
    return msg.channel.send(`${song.title} has been added to the queue!`);
  }
};

const play = (connection, song, player) => {
  const resource = createAudioResource(ytdl(song.url, { filter: "audioonly" }));
  console.log("Connection ------>", connection);
  player = createAudioPlayer();
  console.log("Connection2 ----->", connection);
  connection.subscribe(player);
  console.log("Connection3 ----->", connection);
  player.play(resource);
  player.on(AudioPlayerStatus.Idle, () => {
    // @TODO Play next song
  });
};

const skip = (msg, serverQueue, player, connection) => {
  if (!msg.member.voice.channel)
    return msg.reply(
      "I'm not even in the channel man! What do you want me to even stop - you twat"
    );
  if (!serverQueue)
    return msg.reply("There's not even a song playing man you div");

  serverQueue.songs.shift();
  console.log("WERE HERE ------>", serverQueue.songs);

  if (serverQueue.songs.length === 0)
    return msg.reply(
      "What do you want me to skip to like? There's nee song in the queue"
    );
  else play(connection, serverQueue.songs[0], player);
};

const connectToChannel = async (channel, song, connection, player) => {
  connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
  });
  if (song) {
    play(connection, song, player);
  }

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 30e3);
    return connection;
  } catch (error) {
    connection.destroy();
    // throw error;
    console.error("ERROR 2 ------->", error);
  }
};

const handleShowQueue = (msg, serverQueue) => {
  let queueString = `The current queue is:`;
  queueString = queueString += serverQueue.songs.map(
    ({ title, length }, i) => `
${i + 1}) ${title} - ${formatSecondsToTime(length)}`
  );
  msg.channel.send(queueString);
};

module.exports = {
  // handleJoinChannel,
  handleAddSong,
  play,
  skip,
  connectToChannel,
  handleShowQueue,
};
