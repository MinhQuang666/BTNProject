# Quản lý Booking & Tính phí Container

## Giới thiệu
Đây là hệ thống quản lý booking, container, tính phí vận tải, phục vụ cho doanh nghiệp logistics, vận tải container, hoặc các công ty xuất nhập khẩu. Dự án hỗ trợ quản lý booking, container, công ty, nhà xe, khách hàng, tính phí, lọc/tìm kiếm nâng cao, popup chi tiết, nhập liệu, xuất dữ liệu, v.v.

## Tác giả & Vai trò cá nhân
- Toàn bộ ý tưởng, thiết kế nghiệp vụ, kiến trúc hệ thống, và code đều do tôi chủ động thực hiện.
- Tôi sử dụng AI (GitHub Copilot) như một công cụ hỗ trợ tăng tốc quá trình code, nhưng mọi quyết định về nghiệp vụ, logic, kiểm thử, và hoàn thiện sản phẩm đều do tôi kiểm soát và chịu trách nhiệm.
- Tôi đảm nhiệm tất cả các vai trò: phân tích nghiệp vụ, thiết kế UI/UX, lập trình backend (Node.js), frontend (HTML/JS/CSS), kết nối CSDL, kiểm thử, vận hành.

## Công nghệ sử dụng
- Backend: Node.js (REST API)
- Frontend: HTML, JavaScript, CSS thuần
- Database: PostgreSQL
- Không sử dụng framework lớn, không phải WordPress
- Tận dụng AI (Copilot) để tăng tốc phát triển

## Hướng dẫn cài đặt & sử dụng
### 1. Tạo database PostgreSQL
- Cài đặt PostgreSQL (https://www.postgresql.org/download/)
- Tạo database mới, ví dụ: `CongTyVanTai`
- Mở công cụ quản lý (pgAdmin hoặc psql), chạy toàn bộ nội dung file `CREATE TABLE container (.pgsql` để tạo các bảng cần thiết:
  ```sql
  -- Trong psql:
  \c CongTyVanTai
  \i 'd:/Myproject/BTNProject/CREATE TABLE container (.pgsql'
  ```
- Đảm bảo các bảng như `bookings`, `booking_details`, `companies`, `containers`, `transporters`, `trucks`, ... đã được tạo thành công.

### 2. Cấu hình kết nối database cho backend
- Mở file `Backend/server.js`, chỉnh lại các thông tin:
  ```js
  const pool = new Pool({
      user: 'postgres', // Tên user PostgreSQL
      host: 'localhost',
      database: 'CongTyVanTai', // Tên database vừa tạo
      password: '1', // Mật khẩu PostgreSQL
      port: 5432,
  });
  ```
- (Tùy chọn) Sử dụng file `.env` để bảo mật thông tin kết nối.

### 3. Cài đặt & chạy backend
- Mở terminal, chuyển vào thư mục `Backend`:
  ```sh
  cd Backend
  npm install
  node server.js
  ```
- Server sẽ chạy tại `http://localhost:3000`

### 4. Sử dụng giao diện web
- Mở các file HTML trong thư mục `Frontend` bằng trình duyệt (khuyên dùng Chrome/Edge):
  - `Frontend/employerHome/Booking/booking.html` (Quản lý booking)
  - `Frontend/employerHome/ContainerCharge/ContainerCharge.html` (Tính phí container)
  - ...
- Thao tác CRUD, lọc, popup, tính phí, xuất Excel, ... đều thực hiện trực tiếp trên giao diện.

### 5. Một số lưu ý
- Đảm bảo backend luôn chạy trước khi thao tác trên giao diện web.
- Nếu thay đổi cấu trúc bảng, cần chạy lại file `.pgsql` và khởi động lại backend.
- Nếu gặp lỗi kết nối database, kiểm tra lại thông tin kết nối và trạng thái PostgreSQL.
