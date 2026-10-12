# AquariumControl

Website tiếng Việt để theo dõi và điều khiển bể cá qua Safari trên iPhone, iPad hoặc trình duyệt máy tính. Mã nguồn này thay website CircuitHub cũ trong repo; tên miền triển khai dự kiến là [circuithub.io.vn](https://circuithub.io.vn/).

## Chạy trên máy

Cần Node.js **24.x** và npm. Chạy các lệnh từ thư mục gốc repo:

```sh
npm ci
npm test
npm run dev
```

Mở địa chỉ Vite hiển thị. Để thử trên iPhone cùng Wi-Fi, chạy `npm run dev -- --host 0.0.0.0` rồi mở `http://IP_MAY_TINH:5173` bằng Safari; dùng cổng thực tế Vite thông báo nếu 5173 đang bận.

Web đã nối Firebase project `smartaquarium-14b09`. Hộp thoại đăng nhập hiện khi mở trang; có thể đóng để xem demo. Demo mô phỏng cảm biến, ngõ ra và lệnh servo/còi, lưu dữ liệu trong trình duyệt và không điều khiển phần cứng thật.

## Kết nối bể thật

Đăng ký bằng email/mật khẩu, tạo bể và thêm hệ thống. Firebase **Spark miễn phí** cung cấp Authentication và Realtime Database; Vercel phục vụ giao diện tĩnh. Cấu hình hiện tại không cần Cloud Functions, Cloud Storage hoặc tài khoản thanh toán Firebase.

Pico W cần tài khoản thiết bị riêng, được quản trị viên gán và có firmware theo [hướng dẫn Firebase Spark](docs/FIREBASE_SPARK.md). Chưa có thiết bị thật được cấp quyền trong repo này. Hệ thống chưa gửi heartbeat sẽ hiển thị mất liên lạc và khóa điều khiển.

App Android v2 trước đây dùng đường dẫn `/aquariums`; web này dùng `/sparkAquariums/{ownerUid}`. Dùng chung Firebase Authentication không tự đồng bộ dữ liệu bể giữa hai schema.

## Triển khai Vercel

```sh
npm ci
npm test
npm run build
```

Kết quả build ở `dist/`. `vercel.json` cấu hình framework Vite, cài đặt `npm ci`, build `npm run build` và output `dist`. Project Vercel cần dùng thư mục gốc repo, Node.js 24.x và nhánh production tương ứng. Push GitHub sẽ kích hoạt triển khai nếu project Vercel đang nối repo; chỉ xem tên miền đã cập nhật sau khi deployment thành công và kiểm tra trang thực tế.

`firebase.json` chỉ triển khai Database Rules, không triển khai giao diện hoặc server Vercel. Xem lệnh triển khai Rules trong [tài liệu Spark](docs/FIREBASE_SPARK.md).

## Bảo mật và giới hạn

`public/firebase-config.json` chứa cấu hình Web SDK công khai, gồm API key nhận diện project. Đây không phải khóa quản trị; quyền dữ liệu được kiểm soát bằng Authentication và Rules. [Giải thích chính thức của Firebase](https://firebase.google.com/docs/projects/api-keys).

Không đưa mật khẩu người dùng/thiết bị, service account, database secret hoặc token CLI vào repo hay mã frontend. Chủ bể chỉ được truy cập bể của mình; `reported` và ACK chỉ do thiết bị được gán ghi. Web không tự gửi lại lệnh một lần khi mất mạng. Thông báo hiện trong trang khi đang mở; phiên bản này chưa có push nền iOS.

Trên iPhone, mở website HTTPS bằng Safari rồi chọn **Chia sẻ → Thêm vào Màn hình chính**. Website vẫn cần mạng để tải giao diện, nhận dữ liệu thật và điều khiển.

## Các file chính

- `src/app.js`, `src/styles.css`: giao diện và bố cục responsive.
- `src/demo.js`: dữ liệu mô phỏng trong trình duyệt.
- `src/live.js`, `src/spark.js`: Firebase Auth, dữ liệu và thao tác Spark.
- `src/policy.js`, `tests/`: kiểm tra heartbeat, cảm biến, giới hạn và tiến trình lệnh.
- `firebase/database.spark.rules.json`: phân quyền chủ bể/thiết bị.
- `public/firebase-config.example.json`: mẫu cấu hình khi đổi Firebase project.
