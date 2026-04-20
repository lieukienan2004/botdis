const { Client, GatewayIntentBits, EmbedBuilder, ActivityType } = require('discord.js');
const { DisTube } = require('distube');
const { YtDlpPlugin } = require('@distube/yt-dlp');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const path = require('path');
const express = require('express');
require('dotenv').config();

// FFmpeg path for DisTube v5
const FFMPEG_PATH = ffmpegInstaller.path;
console.log('FFmpeg path:', FFMPEG_PATH);

class MusicBot {
    constructor() {
        this.lastPlayedSong = new Map(); // Track bài đang phát để tránh spam
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildVoiceStates
            ]
        });

        // yt-dlp binary path
        const ytDlpPath = path.join(__dirname, 'node_modules', '@distube', 'yt-dlp', 'bin', 'yt-dlp.exe');
        console.log('yt-dlp path:', ytDlpPath);

        // Khởi tạo DisTube với cấu hình tối ưu cho v5
        this.distube = new DisTube(this.client, {
            plugins: [
                new YtDlpPlugin({
                    update: false,
                    ytdlpPath: ytDlpPath
                })
            ],
            emitNewSongOnly: true,
            savePreviousSongs: true,
            // Cấu hình không bao giờ tự động văng khỏi room
            leaveOnEmpty: false,
            leaveOnFinish: false,
            leaveOnStop: false,
            // DisTube v5 yêu cầu truyền ffmpeg.path trực tiếp
            ffmpeg: {
                path: FFMPEG_PATH,
                args: {
                    global: {},
                    input: {
                        // Tự kết nối lại nếu stream bị ngắt
                        reconnect: 1,
                        reconnect_streamed: 1,
                        reconnect_delay_max: 5
                    },
                    output: {}
                }
            }
        });

        this.setupEventHandlers();
        this.setupDistubeEvents();
        this.setupKeepAlive();
    }

    setupEventHandlers() {
        this.client.once('ready', () => {
            console.log(`🎵 Bot đã sẵn sàng! Đăng nhập với tên: ${this.client.user.tag}`);
            this.client.user.setActivity('🎵 Nhạc 24/7', { type: ActivityType.Listening });
        });

        this.client.on('messageCreate', async (message) => {
            if (message.author.bot || !message.content.startsWith(process.env.PREFIX || '!')) return;
            
            const args = message.content.slice((process.env.PREFIX || '!').length).trim().split(/ +/);
            const command = args.shift().toLowerCase();

            await this.handleCommand(message, command, args);
        });

        this.client.on('error', (error) => {
            console.error('Discord client error:', error);
            this.handleReconnect();
        });

        this.client.on('disconnect', () => {
            console.log('Bot bị disconnect, đang thử reconnect...');
            this.handleReconnect();
        });

        process.on('unhandledRejection', (error) => {
            console.error('Unhandled promise rejection:', error);
        });
    }

    setupDistubeEvents() {
        // Khi bắt đầu phát bài hát
        this.distube.on('playSong', (queue, song) => {
            // Tự động bật lặp queue nếu chưa bật
            if (queue.repeatMode === 0) {
                this.distube.setRepeatMode(queue, 2); // 2 = lặp queue
            }

            // Chỉ gửi thông báo khi bài THAY ĐỔI, không spam khi loop lại
            const lastSong = this.lastPlayedSong.get(queue.id);
            if (lastSong === song.id) return; // Cùng bài → bỏ qua
            this.lastPlayedSong.set(queue.id, song.id);

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('🎵 Đang phát')
                .setDescription(`**${song.name}**`)
                .setThumbnail(song.thumbnail)
                .addFields(
                    { name: '⏱️ Thời lượng', value: song.formattedDuration, inline: true },
                    { name: '👤 Yêu cầu bởi', value: song.user.toString(), inline: true },
                    { name: '🔊 Âm lượng', value: `${queue.volume}%`, inline: true },
                    { name: '🔄 Loop', value: '✅ Lặp queue', inline: true }
                )
                .setURL(song.url);

            queue.textChannel.send({ embeds: [embed] });
        });

        // Khi thêm bài vào queue
        this.distube.on('addSong', (queue, song) => {
            const embed = new EmbedBuilder()
                .setColor('#ffff00')
                .setTitle('➕ Đã thêm vào hàng đợi')
                .setDescription(`**${song.name}**`)
                .setThumbnail(song.thumbnail)
                .addFields(
                    { name: '⏱️ Thời lượng', value: song.formattedDuration, inline: true },
                    { name: '👤 Yêu cầu bởi', value: song.user.toString(), inline: true },
                    { name: '📍 Vị trí', value: `${queue.songs.length}`, inline: true }
                )
                .setURL(song.url);

            queue.textChannel.send({ embeds: [embed] });
        });

        // Khi có lỗi - DisTube v5: tham số là (error, queue)
        this.distube.on('error', (error, queue) => {
            console.error('=== DISTUBE ERROR ===');
            console.error('Error:', error);
            console.error('Error message:', error?.message);
            console.error('Error stack:', error?.stack);
            console.error('====================');
            const channel = queue?.textChannel;
            if (channel && channel.send) {
                const errorMsg = error?.message || 'Có lỗi xảy ra khi phát nhạc!';
                if (errorMsg.includes('Sign in') || errorMsg.includes('login')) {
                    channel.send('❌ Video yêu cầu đăng nhập YouTube. Thử video khác!');
                } else if (errorMsg.includes('unavailable') || errorMsg.includes('not available')) {
                    channel.send('❌ Video không khả dụng hoặc bị hạn chế vùng. Thử video khác!');
                } else if (errorMsg.includes('private')) {
                    channel.send('❌ Video này ở chế độ riêng tư. Thử video khác!');
                } else if (errorMsg.includes('ffmpeg')) {
                    channel.send('❌ Lỗi FFmpeg! Liên hệ admin.');
                } else {
                    channel.send(`❌ Lỗi: ${errorMsg}`);
                }
            }
        });

        // Khi hết bài - không cần thông báo vì đang lặp queue
        this.distube.on('finishSong', (queue) => {
            // Queue đang lặp, không cần làm gì
        });

        // Khi hết hẳn queue (stop được gọi)
        this.distube.on('disconnect', (queue) => {
            queue.textChannel.send('⏹️ Bot đã rời voice channel!');
        });

        // Khi không tìm thấy kết quả
        this.distube.on('searchNoResult', (message, query) => {
            message.reply(`❌ Không tìm thấy kết quả cho: **${query}**`);
        });
    }

    async handleCommand(message, command, args) {
        try {
            switch (command) {
                case 'play':
                case 'p':
                    await this.play(message, args);
                    break;
                case 'skip':
                case 's':
                    await this.skip(message);
                    break;
                case 'stop':
                    await this.stop(message);
                    break;
                case 'queue':
                case 'q':
                    await this.showQueue(message);
                    break;
                case 'volume':
                case 'v':
                    await this.setVolume(message, args);
                    break;
                case 'pause':
                    await this.pause(message);
                    break;
                case 'resume':
                    await this.resume(message);
                    break;
                case 'loop':
                case 'repeat':
                    await this.toggleLoop(message);
                    break;
                case 'autoplay':
                    await this.toggleAutoplay(message);
                    break;
                case 'help':
                    await this.showHelp(message);
                    break;
                case 'nowplaying':
                case 'np':
                    await this.nowPlaying(message);
                    break;
            }
        } catch (error) {
            console.error('Command error:', error);
            message.reply('❌ Có lỗi xảy ra khi thực hiện lệnh!');
        }
    }

    async play(message, args) {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) {
            return message.reply('❌ Bạn cần vào voice channel trước!');
        }

        if (!args.length) {
            return message.reply('❌ Vui lòng cung cấp URL hoặc tên bài hát!\nVí dụ: `!play liều kiên an`');
        }

        const query = args.join(' ');

        // Debug: log voice channel info
        console.log('=== VOICE DEBUG ===');
        console.log('Voice channel:', voiceChannel.name, '| ID:', voiceChannel.id);
        console.log('Voice channel type:', voiceChannel.type);
        console.log('Guild:', message.guild.name, '| ID:', message.guild.id);

        // Check bot permissions in voice channel
        const botMember = message.guild.members.me;
        const perms = voiceChannel.permissionsFor(botMember);
        console.log('Bot permissions in voice channel:');
        console.log('  - Connect:', perms?.has('Connect'));
        console.log('  - Speak:', perms?.has('Speak'));
        console.log('  - ViewChannel:', perms?.has('ViewChannel'));
        console.log('===================');

        if (!perms?.has('Connect')) {
            return message.reply('❌ Bot không có quyền Connect vào voice channel này!');
        }
        if (!perms?.has('Speak')) {
            return message.reply('❌ Bot không có quyền Speak trong voice channel này!');
        }

        try {
            await message.channel.send('🔍 Đang tìm kiếm...');
            await this.distube.play(voiceChannel, query, {
                textChannel: message.channel,
                member: message.member
            });
        } catch (error) {
            console.error('Play error:', error);
            console.error('Error code:', error.errorCode);
            message.reply('❌ Không thể phát bài hát này! Vui lòng thử bài khác.');
        }
    }

    async skip(message) {
        const queue = this.distube.getQueue(message.guild.id);
        if (!queue) {
            return message.reply('❌ Không có bài hát nào đang phát!');
        }

        if (queue.songs.length <= 1) {
            return message.reply('❌ Không có bài hát tiếp theo để skip!');
        }

        try {
            await this.distube.skip(message.guild.id);
            message.reply('⏭️ Đã skip bài hát!');
        } catch (error) {
            message.reply('❌ Không thể skip bài hát!');
        }
    }

    async stop(message) {
        const queue = this.distube.getQueue(message.guild.id);
        if (!queue) {
            return message.reply('❌ Không có bài hát nào đang phát!');
        }

        try {
            await this.distube.stop(message.guild.id);
            message.reply('⏹️ Đã dừng phát nhạc và xóa hàng đợi!');
        } catch (error) {
            message.reply('❌ Không thể dừng phát nhạc!');
        }
    }

    async pause(message) {
        const queue = this.distube.getQueue(message.guild.id);
        if (!queue) {
            return message.reply('❌ Không có bài hát nào đang phát!');
        }

        if (queue.paused) {
            return message.reply('⏸️ Nhạc đã được tạm dừng rồi!');
        }

        try {
            await this.distube.pause(message.guild.id);
            message.reply('⏸️ Đã tạm dừng phát nhạc!');
        } catch (error) {
            message.reply('❌ Không thể tạm dừng!');
        }
    }

    async resume(message) {
        const queue = this.distube.getQueue(message.guild.id);
        if (!queue) {
            return message.reply('❌ Không có bài hát nào đang phát!');
        }

        if (!queue.paused) {
            return message.reply('▶️ Nhạc đang phát rồi!');
        }

        try {
            await this.distube.resume(message.guild.id);
            message.reply('▶️ Đã tiếp tục phát nhạc!');
        } catch (error) {
            message.reply('❌ Không thể tiếp tục phát!');
        }
    }

    async setVolume(message, args) {
        const queue = this.distube.getQueue(message.guild.id);
        if (!queue) {
            return message.reply('❌ Không có bài hát nào đang phát!');
        }

        const volume = parseInt(args[0]);
        if (isNaN(volume) || volume < 0 || volume > 100) {
            return message.reply('❌ Âm lượng phải từ 0 đến 100!');
        }

        try {
            await this.distube.setVolume(message.guild.id, volume);
            message.reply(`🔊 Đã đặt âm lượng thành ${volume}%`);
        } catch (error) {
            message.reply('❌ Không thể thay đổi âm lượng!');
        }
    }

    async toggleLoop(message) {
        const queue = this.distube.getQueue(message.guild.id);
        if (!queue) {
            return message.reply('❌ Không có bài hát nào đang phát!');
        }

        try {
            const mode = this.distube.setRepeatMode(message.guild.id);
            const modeText = mode === 0 ? 'Tắt' : mode === 1 ? 'Lặp bài hát' : 'Lặp hàng đợi';
            message.reply(`🔄 Chế độ lặp: **${modeText}**`);
        } catch (error) {
            message.reply('❌ Không thể thay đổi chế độ lặp!');
        }
    }

    async toggleAutoplay(message) {
        const queue = this.distube.getQueue(message.guild.id);
        if (!queue) {
            return message.reply('❌ Không có bài hát nào đang phát!');
        }

        try {
            const autoplay = this.distube.toggleAutoplay(message.guild.id);
            message.reply(`🎵 Autoplay đã được ${autoplay ? 'bật' : 'tắt'}!`);
        } catch (error) {
            message.reply('❌ Không thể thay đổi autoplay!');
        }
    }

    async nowPlaying(message) {
        const queue = this.distube.getQueue(message.guild.id);
        if (!queue) {
            return message.reply('❌ Không có bài hát nào đang phát!');
        }

        const song = queue.songs[0];
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('🎵 Đang phát')
            .setDescription(`**${song.name}**`)
            .setThumbnail(song.thumbnail)
            .addFields(
                { name: '⏱️ Thời lượng', value: `${queue.formattedCurrentTime} / ${song.formattedDuration}`, inline: true },
                { name: '🔊 Âm lượng', value: `${queue.volume}%`, inline: true },
                { name: '👤 Yêu cầu bởi', value: song.user.toString(), inline: true },
                { name: '🔄 Loop', value: queue.repeatMode === 0 ? 'Tắt' : queue.repeatMode === 1 ? 'Bài hát' : 'Hàng đợi', inline: true },
                { name: '📋 Hàng đợi', value: `${queue.songs.length} bài`, inline: true }
            )
            .setURL(song.url);

        message.channel.send({ embeds: [embed] });
    }

    async showQueue(message) {
        const queue = this.distube.getQueue(message.guild.id);
        if (!queue || !queue.songs.length) {
            return message.reply('❌ Hàng đợi trống!');
        }

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('🎵 Hàng đợi nhạc')
            .setDescription(
                queue.songs
                    .slice(0, 10)
                    .map((song, index) => 
                        `${index === 0 ? '🎵' : `${index}.`} **${song.name}** - \`${song.formattedDuration}\``
                    )
                    .join('\n')
            );

        if (queue.songs.length > 10) {
            embed.setFooter({ text: `Và ${queue.songs.length - 10} bài hát khác...` });
        }

        message.channel.send({ embeds: [embed] });
    }

    async showHelp(message) {
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('🎵 Lệnh Bot Nhạc 24/7')
            .setDescription('Danh sách các lệnh có sẵn:')
            .addFields(
                { name: '🎵 `!play <url/tên bài>` hoặc `!p`', value: 'Phát nhạc từ YouTube', inline: false },
                { name: '⏭️ `!skip` hoặc `!s`', value: 'Skip bài hát hiện tại', inline: false },
                { name: '⏹️ `!stop`', value: 'Dừng phát nhạc và xóa hàng đợi', inline: false },
                { name: '⏸️ `!pause`', value: 'Tạm dừng phát nhạc', inline: false },
                { name: '▶️ `!resume`', value: 'Tiếp tục phát nhạc', inline: false },
                { name: '📋 `!queue` hoặc `!q`', value: 'Hiển thị hàng đợi nhạc', inline: false },
                { name: '🎵 `!nowplaying` hoặc `!np`', value: 'Xem bài đang phát', inline: false },
                { name: '🔊 `!volume <0-100>` hoặc `!v`', value: 'Điều chỉnh âm lượng', inline: false },
                { name: '🔄 `!loop`', value: 'Chuyển đổi chế độ lặp', inline: false },
                { name: '🎲 `!autoplay`', value: 'Bật/tắt tự động phát bài liên quan', inline: false }
            )
            .setFooter({ text: 'Bot nhạc 24/7 - Luôn sẵn sàng phục vụ!' });

        message.channel.send({ embeds: [embed] });
    }

    setupKeepAlive() {
        // TẠO WEB SERVER CHO RENDER
        const app = express();
        const port = process.env.PORT || 3000;
        app.get('/', (req, res) => res.send('Bot nhạc đang hoạt động 24/7!'));
        app.listen(port, () => console.log(`🌍 Web server đang chạy trên port ${port}`));

        if (process.env.KEEP_ALIVE === 'true') {
            setInterval(() => {
                console.log('🔄 Keep alive ping...');
                this.client.user.setActivity('🎵 Nhạc 24/7', { type: ActivityType.Listening });
            }, parseInt(process.env.KEEP_ALIVE_INTERVAL) || 60000);
        }
    }

    handleReconnect() {
        if (process.env.AUTO_RECONNECT === 'true') {
            setTimeout(() => {
                console.log('🔄 Đang thử reconnect...');
                this.client.login(process.env.DISCORD_TOKEN).catch(console.error);
            }, parseInt(process.env.RECONNECT_INTERVAL) || 30000);
        }
    }

    start() {
        this.client.login(process.env.DISCORD_TOKEN);
    }
}

// Khởi tạo và chạy bot
const musicBot = new MusicBot();
musicBot.start();