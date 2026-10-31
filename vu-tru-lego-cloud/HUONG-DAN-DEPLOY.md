# Hướng dẫn deploy Vũ Trụ LEGO (100% Cloudflare Pages + D1 SQLite)

> Phiên bản này đã **loại bỏ hoàn toàn Supabase**, chuyển toàn bộ cơ sở dữ liệu sản phẩm và kho ảnh sang **Cloudflare D1 (SQLite)** tích hợp sẵn trong tài khoản Cloudflare của bạn.

---

## 0. Kiến trúc mới (Cloudflare Pages + D1 SQLite)

| Thành phần | File | Vai trò |
| :--- | :--- | :--- |
| Giao diện shop + Quản lý | `public/index.html` | HTML/CSS/JS tự chứa, tự nén ảnh sang WebP trước khi upload |
| API sản phẩm | `functions/api/products.js` | `GET / POST / PUT / DELETE` trực tiếp vào bảng `products` trong D1 SQLite (tự động xóa ảnh thừa khi sửa/xóa sản phẩm) |
| API upload ảnh | `functions/api/upload.js` | Lưu binary ảnh WebP vào bảng `product_images` trong D1 SQLite |
| API hiển thị ảnh | `functions/api/image.js` | Trả ảnh từ D1 kèm `Cache-Control: public, max-age=31536000, immutable` (Cloudflare CDN cache ở edge) |
| Schema SQLite | `schema.sql` | Tạo 2 bảng `products` và `product_images` |
| Biến môi trường | `ADMIN_TOKEN` | Mật khẩu vào khu vực Quản lý sản phẩm |

---

## 1. Cách A: Deploy tự động qua Wrangler CLI (Nhanh nhất – 2 phút)

Nếu chạy trên máy tính:

```bash
cd ~/space/duanyu/vu-tru-lego-deploy/vu-tru-lego-cloud

# 1. Đăng nhập Cloudflare (mở trình duyệt xác nhận 1 lần)
npx wrangler login

# 2. Tạo database SQLite (D1) tên là vu-tru-lego-db
npx wrangler d1 create vu-tru-lego-db
# -> Copy giá trị `database_id` hiện ra trên màn hình dán vào file `wrangler.toml`

# 3. Khởi tạo bảng SQLite trên D1
npx wrangler d1 execute vu-tru-lego-db --remote --file=./schema.sql

# 4. Tạo project Cloudflare Pages và deploy code
npx wrangler pages project create vu-tru-lego --production-branch=main
npx wrangler pages deploy public --project-name=vu-tru-lego

# 5. Đặt mật khẩu quản lý ADMIN_TOKEN
npx wrangler pages secret put ADMIN_TOKEN --project-name=vu-tru-lego
```

---

## 2. Cách B: Deploy qua giao diện Web (Cloudflare Dashboard + GitHub)

### Bước 1: Tạo Database D1 (SQLite)
1. Vào https://dash.cloudflare.com → menu trái **Storage & Databases** → **D1 SQL Database** → **Create Database**.
2. Đặt tên: `vu-tru-lego-db` → bấm **Create**.
3. Vào tab **Console** của database vừa tạo, copy toàn bộ nội dung file [`schema.sql`](./schema.sql) dán vào ô truy vấn và bấm **Execute** (tạo 2 bảng `products` và `product_images`).

### Bước 2: Tạo project Cloudflare Pages từ GitHub
1. Menu trái **Workers & Pages** → **Create** → tab **Pages** → **Connect to Git** → chọn repo GitHub của bạn.
2. Cấu hình build:
   - **Project name**: `vu-tru-lego`
   - **Framework preset**: `None`
   - **Build command**: *(để trống)*
   - **Build output directory**: `public`
3. Mở **Environment variables**, thêm 1 biến:
   - `ADMIN_TOKEN` = chuỗi mật khẩu quản lý của bạn (tự đặt, ví dụ chạy `openssl rand -base64 32`).
4. Bấm **Save and Deploy**.

### Bước 3: Gắn D1 Database vào Pages
1. Trong trang quản lý project `vu-tru-lego` vừa tạo trên Cloudflare Pages, vào **Settings** → **Bindings** (hoặc **Functions** → **D1 database bindings**).
2. Bấm **Add** → chọn **D1 database**:
   - **Variable name**: `DB` *(bắt buộc viết hoa đúng chữ `DB`)*
   - **D1 database**: chọn `vu-tru-lego-db`
3. Bấm **Save**, sau đó sang tab **Deployments** → bấm **⋯ → Retry deployment** (Redeploy) để binding có hiệu lực.

---

## 3. Kiểm tra sau khi deploy

- [ ] Mở `https://<ten-project>.pages.dev/api/products` → trả về `[]`.
- [ ] Mở `https://<ten-project>.pages.dev/` → bấm **⚙ Quản lý sản phẩm** góc dưới phải → nhập `ADMIN_TOKEN`.
- [ ] Thêm thử 1 sản phẩm kèm 2–3 ảnh → bấm **Lưu sản phẩm** → hiện thông báo thành công và ảnh hiển thị ngay ngoài trang chủ.
