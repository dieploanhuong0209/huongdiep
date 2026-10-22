# Portfolio Hương Diệp – Supabase và quyền Admin

## 1. Sao lưu trước khi triển khai

Trên **máy đang có danh sách bài viết đầy đủ nhất**, mở website cũ → Admin → Sao lưu dữ liệu → tải file JSON. Giữ file này an toàn. Các bài chỉ nằm trong localStorage của một máy không thể tự chuyển lên Supabase nếu không xuất từ chính máy đó.

## 2. Tạo dự án Supabase

1. Đăng nhập https://supabase.com/dashboard, tạo project.
2. Mở **SQL Editor**, chạy toàn bộ file `supabase/schema.sql`.
3. Mở **Authentication → Users → Add user**. Tạo duy nhất tài khoản cho bạn với email cá nhân và mật khẩu mạnh, email được xác nhận theo hướng dẫn của dashboard. Trong **Authentication → Providers → Email**, tắt **Allow new users to sign up** sau khi tạo tài khoản.
4. Sao chép **User UID** của tài khoản vừa tạo. Trong SQL Editor chạy:

   ```sql
   insert into public.portfolio_admins (user_id)
   values ('THAY-BANG-USER-UID-CUA-BAN') on conflict do nothing;
   ```

   Tuyệt đối không sử dụng UUID của người khác. Chỉ có UID này được chỉnh sửa portfolio.

## 3. Kết nối Vercel

Trong **Supabase → Project Settings → API** lấy Project URL và **publishable key / anon key**. Đây là khóa công khai được RLS bảo vệ; tuyệt đối không dùng `service_role`/secret key trong biến có tiền tố `VITE_`.

Vào Vercel → project `huongdiep` → Settings → Environment Variables:

| Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase publishable/anon key |
| `GEMINI_API_KEY` | Gemini API key (nếu dùng tính năng AI) |

Chọn Production (và Preview nếu cần), lưu và tạo **deployment mới từ commit GitHub mới nhất**.

## 4. Đưa dữ liệu cũ lên mọi máy

1. Mở website mới và đăng nhập Admin bằng **email + mật khẩu Supabase**.
2. Vào **Backup / Import JSON**, chọn file sao lưu ở bước 1. Thao tác này cập nhật **toàn bộ** dữ liệu portfolio trong cơ sở dữ liệu dùng chung, nên chỉ nhập bản đầy đủ nhất.
3. Kiểm tra trên máy khác hoặc cửa sổ ẩn danh. Người xem có thể xem bài, nhưng chỉ tài khoản đã cấp UID trong `portfolio_admins` được sửa.
4. Website lấy dữ liệu mới khi mở trang, quay lại tab hoặc mỗi 20 giây khi trang đang hiển thị. Dữ liệu thay đổi sau khi bấm lưu có thể cần vài giây.

## Lưu ý

- Không tải `.env` chứa khóa bí mật lên GitHub.
- Nếu mất mạng hoặc Supabase từ chối lưu, ứng dụng sẽ báo lỗi. Luôn giữ bản sao lưu JSON.
- Chưa có dữ liệu trong bảng `portfolio_state`: giao diện có thể hiện nội dung mẫu đóng gói. Bạn cần nhập backup từ Admin để khởi tạo dữ liệu chung.
- Đây là cách đồng bộ cho một chủ tài khoản. Với nhiều người cùng sửa đồng thời, cần bổ sung kiểm soát xung đột phiên bản.
