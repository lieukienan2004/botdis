require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { Player } = require('discord-player');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const player = new Player(client);

// Load extractors
player.extractors.loadDefault();

client.once('ready', () => {
  console.log(`✅ Bot đã sẵn sàng! Đăng nhập với tên: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  
  const prefix = '!';
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // Lệnh !play
  if (command === 'play') {
    if (!message.member.voice.channel) {
      return message.reply('❌ Bạn cần vào voice channel trước!');
    }

    const query = args.join(' ');
    if (!query) {
      return message.reply('❌ Vui lòng nhập tên bài hát hoặc link!');
    }

    try {
      const { track } = await player.play(message.member.voice.channel, query, {
        nodeOptions: {
          metadata: message
        }
      });

      return message.reply(`🎵 Đang phát: **${track.title}**`);
    } catch (error) {
      console.error(error);
      return message.reply('❌ Có lỗi xảy ra khi phát nhạc!');
    }
  }

  // Lệnh !skip
  if (command === 'skip') {
    const queue = player.nodes.get(message.guildId);
    if (!queue || !queue.isPlaying()) {
      return message.reply('❌ Không có bài hát nào đang phát!');
    }

    queue.node.skip();
    return message.reply('⏭️ Đã skip bài hát!');
  }

  // Lệnh !stop
  if (command === 'stop') {
    const queue = player.nodes.get(message.guildId);
    if (!queue) {
      return message.reply('❌ Không có bài hát nào đang phát!');
    }

    queue.delete();
    return message.reply('⏹️ Đã dừng nhạc và rời khỏi voice channel!');
  }

  // Lệnh !queue
  if (command === 'queue') {
    const queue = player.nodes.get(message.guildId);
    if (!queue || !queue.isPlaying()) {
      return message.reply('❌ Không có bài hát nào trong hàng đợi!');
    }

    const tracks = queue.tracks.toArray();
    const current = queue.currentTrack;
    
    let queueString = `🎵 **Đang phát:** ${current.title}\n\n`;
    
    if (tracks.length > 0) {
      queueString += '**Hàng đợi:**\n';
      tracks.slice(0, 10).forEach((track, i) => {
        queueString += `${i + 1}. ${track.title}\n`;
      });
    }

    return message.reply(queueString);
  }

  // Lệnh !pause
  if (command === 'pause') {
    const queue = player.nodes.get(message.guildId);
    if (!queue || !queue.isPlaying()) {
      return message.reply('❌ Không có bài hát nào đang phát!');
    }

    queue.node.pause();
    return message.reply('⏸️ Đã tạm dừng!');
  }

  // Lệnh !resume
  if (command === 'resume') {
    const queue = player.nodes.get(message.guildId);
    if (!queue) {
      return message.reply('❌ Không có bài hát nào trong hàng đợi!');
    }

    queue.node.resume();
    return message.reply('▶️ Đã tiếp tục phát!');
  }

  // Lệnh !help
  if (command === 'help') {
    const helpMessage = `
🎵 **Lệnh Bot Nhạc:**
\`!play <tên bài hát hoặc link>\` - Phát nhạc
\`!skip\` - Bỏ qua bài hiện tại
\`!stop\` - Dừng nhạc và rời voice channel
\`!queue\` - Xem hàng đợi
\`!pause\` - Tạm dừng
\`!resume\` - Tiếp tục phát
\`!help\` - Hiển thị trợ giúp
    `;
    return message.reply(helpMessage);
  }
});

client.login(process.env.DISCORD_TOKEN);
