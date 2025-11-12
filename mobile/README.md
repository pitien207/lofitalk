## LofiTalk Mobile

Ứng dụng Expo SDK 54 kết nối backend hiện tại để đăng nhập.

### 1. Cấu hình

Tạo file `mobile/.env`:

```
EXPO_PUBLIC_API_BASE_URL=http://<IP-máy-tính>:5001/api
```

Điện thoại và máy tính phải chung Wi-Fi. Thay `<IP-máy-tính>` bằng địa chỉ LAN (ví dụ `192.168.1.15`).

### 2. Cài đặt & chạy

```bash
cd mobile
npm install
npm run start -- --lan
```

Quét QR bằng Expo Go. Nhập email/mật khẩu đang dùng trên LofiTalk web – nếu đúng sẽ chuyển sang màn hình Home tạm.
