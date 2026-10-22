# Triển khai portfolio trên Vercel

1. Tải toàn bộ mã nguồn này lên repository GitHub đã kết nối với Vercel, giữ nguyên cấu trúc thư mục `api/` ở cấp gốc.
2. Trong Vercel, mở **Project → Settings → Environments → Production → Environment Variables**. Thêm `GEMINI_API_KEY` chứa khóa Gemini API của chính bạn. Tuyệt đối không thêm khóa vào mã nguồn hoặc biến có tiền tố `VITE_`.
3. Triển khai lại dự án bằng commit mới trên nhánh `main`. Kiểm tra trang **Deployments** xem build đã thành công.
4. Trên website, thử dán một link bài báo công khai. Nếu bài chặn bot hoặc không khai báo ngày đăng, ứng dụng có thể chỉ lấy được một phần thông tin; hãy bổ sung thủ công.

## Cần biết về lưu dữ liệu

API `/api/fetch-metadata` hiện chạy qua Vercel Function thay vì middleware chỉ có ở máy chủ phát triển Vite.

Tuy nhiên, `/api/portfolio-data` trong `vite.config.ts` **vẫn chỉ hoạt động khi phát triển cục bộ**. Ở bản web đang triển khai, thay đổi admin chủ yếu lưu trong `localStorage` của trình duyệt, không tự đồng bộ giữa nhiều máy. Trước khi xóa dữ liệu trình duyệt, hãy xuất bản sao lưu JSON từ trang quản trị. Để đồng bộ dữ liệu xuyên thiết bị, cần tích hợp cơ sở dữ liệu bền vững và xác thực admin phía server.
