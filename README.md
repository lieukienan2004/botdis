# Discord Music Bot 24/7 🎵

Bot nhạc Discord có thể hoạt động 24/7 với tính năng tự động reconnect và không bị văng khỏi room.

## ✨ Tính năng

- 🎵 Phát nhạc từ YouTube (URL hoặc tìm kiếm)
- 🔄 Tự động reconnect khi bị disconnect
- 🏠 Hoạt động 24/7 không bị văng
- 📋 Hàng đợi nhạc
- 🔊 Điều chỉnh âm lượng
- 🔄 Loop bài hát
- ⏭️ Skip, stop, pause
- 🤖 Tự động join channel khi có user

## 🚀 Cài đặt

1. **Clone repository:**
```bash
git clone <your-repo-url>
cd discord-music-bot-24-7
```

2. **Cài đặt dependencies:**
```bash
npm install
```

3. **Cấu hình bot:**
   - Tạo bot Discord tại [Discord Developer Portal](https://discord.com/developers/applications)
   - Copy Bot Token
   - Cập nhật file `.env`:

```env
DISCORD_TOKEN=your_bot_token_here
PREFIX=!
DEFAULT_VOLUME=50
AUTO_RECONNECT=true
KEEP_ALIVE=true
```

4. **Chạy bot:**
```bash
npm start
```

## 🎮 Lệnh sử dụng

| Lệnh | Mô tả |
|------|-------|
| `!play <url/tên bài>` hoặc `!p` | Phát nhạc từ YouTube |
| `!skip` hoặc `!s` | Skip bài hát hiện tại |
| `!stop` | Dừng phát nhạc và xóa hàng đợi |
| `!queue` hoặc `!q` | Hiển thị hàng đợi nhạc |
| `!volume <0-100>` hoặc `!v` | Điều chỉnh âm lượng |
| `!loop` | Bật/tắt lặp lại bài hát |
| `!join` | Bot join vào voice channel |
| `!leave` | Bot rời khỏi voice channel |
| `!help` | Hiển thị danh sách lệnh |

## ⚙️ Cấu hình nâng cao

### File .env

```env
# Discord Bot Token (bắt buộc)
DISCORD_TOKEN=your_bot_token_here

# Cấu hình bot
PREFIX=!
DEFAULT_VOLUME=50

# Channel IDs (tùy chọn)
VOICE_CHANNEL_ID=123456789012345678
TEXT_CHANNEL_ID=123456789012345678

# Tự động reconnect
AUTO_RECONNECT=true
RECONNECT_INTERVAL=30000

# Keep alive (chống crash)
KEEP_ALIVE=true
KEEP_ALIVE_INTERVAL=60000

# Tự động join khi có user
AUTO_JOIN=true
```

## 🔧 Tính năng 24/7

Bot được thiết kế để hoạt động 24/7 với các tính năng:

1. **Auto Reconnect**: Tự động kết nối lại khi bị disconnect
2. **Keep Alive**: Ping định kỳ để duy trì kết nối
3. **Error Handling**: Xử lý lỗi và tự phục hồi
4. **Voice Reconnect**: Tự động join lại voice channel khi bị văng
5. **Memory Management**: Quản lý bộ nhớ hiệu quả

## 🚀 Deploy lên Cloud

### Railway
1. Fork repository này
2. Kết nối với Railway
3. Thêm environment variables
4. Deploy

### Heroku
1. Tạo app mới trên Heroku
2. Connect với GitHub repository
3. Thêm Config Vars
4. Deploy

### VPS
```bash
# Cài đặt PM2 để chạy 24/7
npm install -g pm2

# Chạy bot với PM2
pm2 start index.js --name "music-bot"

# Lưu cấu hình PM2
pm2 save
pm2 startup
```

## 🛠️ Troubleshooting

### Bot không phát được nhạc
- Kiểm tra bot có quyền `Connect` và `Speak` trong voice channel
- Đảm bảo đã cài đặt FFmpeg
- Kiểm tra internet connection

### Bot bị disconnect liên tục
- Kiểm tra token bot có đúng không
- Đảm bảo `AUTO_RECONNECT=true`
- Kiểm tra server hosting có ổn định không

### Lỗi "Cannot find module"
```bash
# Xóa node_modules và cài lại
rm -rf node_modules package-lock.json
npm install
```

## 📝 Changelog

### v2.0.0
- ✅ Hoàn toàn viết lại với Discord.js v14
- ✅ Thêm tính năng 24/7 với auto-reconnect
- ✅ Cải thiện xử lý lỗi
- ✅ Thêm keep-alive mechanism
- ✅ UI/UX tốt hơn với embeds
- ✅ Hỗ trợ tìm kiếm YouTube

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Hãy tạo issue hoặc pull request.

## 📄 License

MIT License - Xem file LICENSE để biết thêm chi tiết.

## 🆘 Hỗ trợ

Nếu gặp vấn đề, hãy tạo issue trên GitHub hoặc liên hệ qua Discord.

---

**Lưu ý**: Bot cần quyền Administrator hoặc các quyền cụ thể:
- Read Messages
- Send Messages  
- Connect
- Speak
- Use Voice Activity