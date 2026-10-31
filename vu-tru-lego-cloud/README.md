# Vũ Trụ LEGO – Cloudflare Pages + D1 (SQLite)

Dự án đã được chuyển đổi **100% sang Cloudflare Pages + Cloudflare D1 (SQLite)**, **loại bỏ hoàn toàn Supabase**.
- Toàn bộ sản phẩm và ảnh WebP được lưu trực tiếp trong SQLite (`Cloudflare D1`).
- Không bao giờ bị tự động ngủ đông (pause) sau 7 ngày như Supabase Free.
- Không cần thẻ tín dụng (Free 5 GB SQLite, 5 triệu lượt đọc/ngày, 100.000 lượt ghi/ngày).
- Chỉ cần duy nhất 1 biến môi trường: `ADMIN_TOKEN`.

## Cấu trúc thư mục

```text
vu-tru-lego-deploy/
├── public/
│   └── index.html              # Giao diện cửa hàng + trang quản lý sản phẩm
├── functions/
│   └── api/
│       ├── products.js         # CRUD sản phẩm (/api/products) trên Cloudflare D1
│       ├── upload.js           # Upload ảnh nén WebP (/api/upload) vào bảng product_images
│       └── image.js            # Phục vụ ảnh (/api/image?id=...) kèm CDN Cache 1 năm
├── schema.sql                  # Schema khởi tạo 2 bảng SQLite: products & product_images
├── wrangler.toml               # Cấu hình Cloudflare Pages + D1 binding (DB)
├── .dev.vars.example           # Mẫu biến ADMIN_TOKEN khi chạy thử ở local
└── HUONG-DAN-DEPLOY.md         # Hướng dẫn deploy chi tiết từng bước
```

## Deploy nhanh bằng CLI hoặc Dashboard

Xem chi tiết trong [`HUONG-DAN-DEPLOY.md`](./HUONG-DAN-DEPLOY.md).
