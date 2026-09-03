# Khách Hàng Bản Đồ

Web quản lý khách hàng dùng chung nhiều thiết bị.

## Có sẵn
- Đăng nhập Supabase
- Thêm khách hàng
- Họ tên, SĐT, CCCD, địa chỉ, ghi chú
- Lấy GPS
- Tra cứu
- Mở vị trí trên Google Maps
- Dữ liệu lưu tập trung trong Supabase

## Cài đặt
1. Tạo project Supabase.
2. Vào SQL Editor, chạy toàn bộ `schema.sql`.
3. Tạo tài khoản người dùng trong Authentication.
4. Mở `app.js`, thay `SUPABASE_URL` và `SUPABASE_ANON_KEY`.
5. Upload 4 file lên GitHub và deploy repo trên Vercel.

Lưu ý: không đưa `service_role` key vào frontend. Chỉ dùng anon/publishable key.
