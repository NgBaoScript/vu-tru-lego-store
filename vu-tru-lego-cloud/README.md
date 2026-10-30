# Vũ Trụ LEGO – Website + quản lý sản phẩm đồng bộ

Website mobile-first phong cách premium, có trang cửa hàng và trang quản lý sản phẩm. Dữ liệu sản phẩm lưu trong Supabase; ảnh lưu ở Supabase Storage. Sau khi cấu hình, bạn thêm/sửa/xóa sản phẩm một lần và tất cả khách truy cập đều thấy dữ liệu mới, không cần deploy lại.

## Tính năng
- Trang cửa hàng responsive, tối ưu điện thoại.
- Danh sách sản phẩm, bộ lọc danh mục, trang chi tiết.
- Thông tin: mã sản phẩm, giá, số mảnh, độ tuổi, kích thước hộp, cân nặng.
- Tối đa 3 ảnh/sản phẩm; ảnh tự nén WebP trước khi tải lên.
- Quản lý thêm/sửa/xóa sản phẩm.
- TikTok đã trỏ đến https://www.tiktok.com/@legouniverse.store.
- Zalo/Facebook hiện là link mẫu; thay URL thật trong `index.html` trước khi công khai.

## 1. Tạo Supabase
1. Tạo project tại https://supabase.com/.
2. Mở SQL Editor > New query.
3. Copy toàn bộ nội dung `supabase-setup.sql`, nhấn Run.
4. Vào Project Settings > API. Lấy `Project URL` và `service_role` key (không phải anon key).

## 2. Đưa source lên GitHub
1. Giải nén ZIP.
2. Tạo repository GitHub mới.
3. Upload toàn bộ nội dung bên trong thư mục này, giữ nguyên `api/`, `index.html`, `package.json` và `supabase-setup.sql`.

## 3. Deploy trên Vercel
1. Vào https://vercel.com/ > Add New > Project > Import repository.
2. Framework Preset chọn `Other`.
3. Trong Environment Variables, thêm đủ 3 biến:

| Name | Value |
|---|---|
| `SUPABASE_URL` | Project URL trong Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key trong Supabase |
| `ADMIN_TOKEN` | Tự tạo một chuỗi bí mật dài, khó đoán (ví dụ dùng trình quản lý mật khẩu tạo chuỗi ngẫu nhiên) |

4. Chọn Deploy. Nếu đã deploy trước khi thêm biến môi trường, vào Deployments > Redeploy.

**Bảo mật:** Tuyệt đối không đặt `SUPABASE_SERVICE_ROLE_KEY` trong `index.html`, không gửi key này cho người khác và không commit vào GitHub. API chỉ cho phép đọc công khai; thêm/sửa/xóa và upload ảnh cần `ADMIN_TOKEN`. Đây là một mã quản lý dùng chung, không phải hệ thống tài khoản/phân quyền nhiều người.

## 4. Cách thêm sản phẩm
1. Mở website đã deploy.
2. Nhấn `Quản lý sản phẩm` ở góc dưới bên phải.
3. Nhập giá trị `ADMIN_TOKEN` đã cấu hình trong Vercel.
4. Điền tên, mã, giá, mô tả, số mảnh, độ tuổi, kích thước hộp, cân nặng.
5. Chọn tối đa 3 ảnh chụp sản phẩm thật rồi nhấn `Lưu sản phẩm`.
6. Sản phẩm tự đồng bộ lên website cho mọi khách truy cập.

## 5. Cập nhật liên hệ
Trong `index.html`, tìm `zaloLink` và `facebookLink`, thay URL mẫu bằng link Zalo/Facebook chính thức của shop.

## Lưu ý nội dung
- Sản phẩm và thông số hiện không được seed sẵn để tránh hiển thị giá/spec giả. Hãy nhập dữ liệu thật từ hàng đang có.
- Hình xe minh họa ở phần hero chỉ là đồ họa trang trí, không đại diện cho một mẫu hàng cụ thể. Hãy dùng ảnh chụp sản phẩm thật khi tạo sản phẩm.
- Cần ghi rõ đây là mô hình tương thích LEGO, không phải LEGO chính hãng.
