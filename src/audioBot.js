const ytdl = require("ytdl-core");
const {
  joinVoiceChannel,
  entersState,
  VoiceConnectionStatus,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
} = require("@discordjs/voice");
const { formatSecondsToTime, getUrlFromCommand } = require("./functions");

class AudioBot {
  constructor(command, serverQueue, queue, voiceChannel, connection, player) {
    this.command = command;
    this.serverQueue = serverQueue;
    this.queue = queue;
    this.voiceChannel = voiceChannel;
    this.connection = connection;
    this.player = player;
    this.songs = [];
  }

  handleJoinChannel(msg) {
    this.voiceChannel = msg.member.voice.channel;
    // If the user doing the command is not part of a voice channel
    if (!this.voiceChannel) {
      msg.reply(`You're not even in a voice channel you fucking tool`);
      return;
    }

    const permissions = this.voiceChannel.permissionsFor(msg.client.user);
    // Do we have the correct permissions to connect to and speak in the voice channel
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
      msg.channel.send(
        "I don't even have the right permissions to join and speak in the channel... Fucks sake"
      );
      return;
    }
    this.connection = joinVoiceChannel({
      channelId: this.voiceChannel.id,
      guildId: this.voiceChannel.guild.id,
      adapterCreator: this.voiceChannel.guild.voiceAdapterCreator,
    });
  }

  play(song) {
    if (!song) {
      this.player.unpause();
    } else {
      const resource = createAudioResource(
        ytdl(song.url, { filter: "audioonly" })
      );
      this.player = createAudioPlayer();
      this.connection.subscribe(this.player);
      this.player.play(resource);
      this.player.on(AudioPlayerStatus.Idle, () => {
        this.songs.shift();
        if (this.songs.length !== 0) {
          this.play(this.songs[0]);
        }
      });
    }
  }

  pause() {
    this.player.pause();
  }

  stop() {
    this.player.stop();
    this.songs = [];
  }

  resume() {
    this.player.unpause();
  }

  async handleAddSong(msg) {
    if (
      msg.content.trim() === `${process.env.BOT_PREFIX} play` ||
      msg.content.trim() === `${process.env.BOT_PREFIX}play`
    ) {
      if (this.player) this.player.unpause();
      return;
    }
    const urlToDecode = await getUrlFromCommand(msg.content);
    if (!urlToDecode.startsWith("https://www.youtube.com/watch?")) {
      if (this.player) {
        this.player.unpause();
        msg.reply(
          `That's not a proper link man... Honestly can't get the staff. Use the 'resume' command next time if that's what you want to do. Doylem`
        );
      }
    } else {
      const songInfo = await ytdl.getInfo(urlToDecode);
      const song = {
        title: songInfo.videoDetails.title,
        url: songInfo.videoDetails.video_url,
        length: songInfo.videoDetails.lengthSeconds,
      };
      this.songs.push(song);

      msg.reply(`${song.title} has been added to the queue`);

      if (!this.serverQueue) {
        const queueConstruct = {
          textChannel: msg.channel,
          voiceChannel: this.voiceChannel,
          connection: null,
          songs: [],
          volume: 5,
          playing: true,
        };

        this.queue.set(msg.guild.id, queueConstruct);
        queueConstruct.songs.push(song);

        try {
          await this.connectToChannel(song);
        } catch (err) {
          console.error("ERROR1 ------>", err);
          this.queue.delete(msg.guild.id);
          return msg.channel.send(err);
        }
      } else {
        this.serverQueue.songs.push(song);
        this.play(song);
        return msg.channel.send(`${song.title} has been added to the queue!`);
      }
    }
  }

  skip(msg) {
    if (!msg.member.voice.channel)
      return msg.reply(
        "I'm not even in the channel man! What do you want me to even stop? You twat"
      );
    if (this.songs.length === 0)
      return msg.reply(
        "What do you want me to skip to like? There's nee cunt in the queue"
      );
    this.songs.shift();
    if (this.songs.length === 0)
      msg.channel.send(`That was the last song in the queue!`);
    else this.play(this.songs[0]);
  }

  async connectToChannel(song) {
    this.connection = joinVoiceChannel({
      channelId: this.voiceChannel.id,
      guildId: this.voiceChannel.guild.id,
      adapterCreator: this.voiceChannel.guild.voiceAdapterCreator,
    });
    if (song && this.songs.length === 1) {
      this.play(song);
    }

    try {
      await entersState(this.connection, VoiceConnectionStatus.Ready, 30e3);
      return this.connection;
    } catch (error) {
      this.connection.destroy();
      // throw error;
      console.error("ERROR 2 ------->", error);
    }
  }

  handleShowQueue(msg) {
    let queueString = `The current queue is:`;
    if (this.songs.length > 0) {
      queueString = queueString += this.songs.map(
        ({ title, length }, i) => `
  ${i + 1}) ${title} - ${formatSecondsToTime(length)}`
      );
      msg.channel.send(queueString);
    } else {
      queueString = `Haha what a twat, there's nowt in the queue ${msg.author.username}`;
      msg.reply(queueString);
    }
  }
}

module.exports = {
  AudioBot,
};
