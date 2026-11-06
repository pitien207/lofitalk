## LofiTalk Mobile

Ứng dụng Expo SDK 54 kết nối backend hiện tại để đăng nhập.

### 1. Cấu hình

Mọi URL server nằm ở một chỗ: [src/config.js](src/config.js). Mặc định app dùng backend production `https://lofitalk.nghiapham.org`.

Để chạy với backend trên máy tính, tạo file `mobile/.env`:

```
EXPO_PUBLIC_SERVER_URL=http://<IP-máy-tính>:5001
```

Điện thoại và máy tính phải chung Wi-Fi. Thay `<IP-máy-tính>` bằng địa chỉ LAN (ví dụ `192.168.1.15`). API (`/api`), Socket.IO và ảnh avatar đều tự lấy từ địa chỉ này.

### 2. Cài đặt & chạy

```bash
cd mobile
npm install
npm run start -- --lan
```

Quét QR bằng Expo Go. Nhập email/mật khẩu đang dùng trên LofiTalk web – nếu đúng sẽ chuyển sang màn hình Home tạm.
