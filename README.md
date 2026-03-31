# Discord Music Bot

Bot nhạc Discord đơn giản sử dụng discord.js và discord-player.

## Cài đặt

1. Cài đặt Node.js (phiên bản 16.9.0 trở lên)

2. Cài đặt dependencies:
```bash
npm install
```

3. Tạo bot Discord:
   - Truy cập https://discord.com/developers/applications
   - Tạo New Application
   - Vào tab "Bot" và tạo bot
   - Bật "Message Content Intent" trong Bot settings
   - Copy token

4. Mời bot vào server:
   - Vào tab "OAuth2" > "URL Generator"
   - Chọn scopes: `bot`
   - Chọn permissions: `Send Messages`, `Connect`, `Speak`, `Use Voice Activity`
   - Copy link và mở trong trình duyệt để mời bot

5. Cấu hình:
   - Copy `.env.example` thành `.env`
   - Dán token vào file `.env`

6. Chạy bot:
```bash
npm start
```

## Lệnh

- `!play <tên bài hát hoặc link>` - Phát nhạc từ YouTube
- `!skip` - Bỏ qua bài hiện tại
- `!stop` - Dừng nhạc và rời voice channel
- `!queue` - Xem hàng đợi
- `!pause` - Tạm dừng
- `!resume` - Tiếp tục phát
- `!help` - Hiển thị trợ giúp

## Ví dụ

```
!play never gonna give you up
!play https://www.youtube.com/watch?v=dQw4w9WgXcQ
```
