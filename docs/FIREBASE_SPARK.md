# Firebase Spark cho AquariumControl

Web dùng project **`smartaquarium-14b09`** với Realtime Database tại Singapore:

```text
https://smartaquarium-14b09-default-rtdb.asia-southeast1.firebasedatabase.app
```

Firebase Authentication Email/Password đã bật; project được kiểm tra vẫn chưa liên kết billing. Web dùng **Spark miễn phí** trong hạn mức của dịch vụ. Vercel phục vụ giao diện tĩnh; repo này không triển khai Cloud Functions, Cloud Storage, Scheduler hoặc Firebase Hosting.

`public/firebase-config.json` chứa cấu hình Web SDK, gồm `databaseURL` và `backendMode: "spark"`. API key Firebase dùng để nhận diện project, không cấp quyền quản trị hay đọc/ghi Database. Việc bảo vệ dữ liệu dựa trên Authentication và Security Rules. [Tài liệu API key Firebase](https://firebase.google.com/docs/projects/api-keys).

## Cấu hình và triển khai Rules

Các hostname `circuithub.io.vn`, `www.circuithub.io.vn` và `circuit-hub-khaki.vercel.app` đã được thêm vào Authentication → Settings → Authorized domains. Nếu đổi tên miền, thêm hostname mới trong [Firebase Console](https://console.firebase.google.com/project/smartaquarium-14b09/authentication/settings); không nhập giao thức hay đường dẫn. Authorized domains không thay thế quyền Database.

File `firebase.json` ở gốc repo trỏ đến `firebase/database.spark.rules.json`; `.firebaserc` chọn project `smartaquarium-14b09`. Khi cần cập nhật Rules, chạy từ gốc repo bằng tài khoản quản trị project:

```sh
npx firebase-tools login
npx firebase-tools deploy --project smartaquarium-14b09 --only database
```

Không đổi Rules thành đọc/ghi công khai hoặc bật test mode. Lệnh trên chỉ triển khai Rules; không build/publish website, không nâng cấp gói thanh toán và không tạo dữ liệu thiết bị. Việc sửa file trên máy chỉ có hiệu lực trên project thật sau khi triển khai thành công.

Build và kiểm tra web độc lập với triển khai Rules:

```sh
npm ci
npm test
npm run build
```

`npm test` chạy kiểm thử logic web trong thư mục `tests/`; không phải kiểm thử Rules emulator hay xác minh Pico thật. Vercel triển khai thư mục `dist/` theo `vercel.json`.

## Đường dẫn và quyền dữ liệu

```text
users/{ownerUid}/profile
users/{ownerUid}/preferences
sparkAquariums/{ownerUid}/{tankId}/meta
sparkAquariums/{ownerUid}/{tankId}/systems/{systemId}/...
sparkDeviceAccounts/{deviceUid} = true
sparkDevices/{deviceUid} = { ownerUid, tankId, systemId, enabled: true }
```

Mỗi chủ bể chỉ đọc được `/sparkAquariums/{uid của mình}`. Thiết bị chỉ đọc hệ thống được quản trị viên gán. Client không được đọc hoặc ghi danh sách cấp quyền `sparkDevices`; mỗi tài khoản chỉ đọc được cờ `sparkDeviceAccounts/{uid của mình}` và không được sửa cờ này.

Các đường dẫn trong bảng dưới đây tương đối với một system:

| Nhánh | Chủ bể | Thiết bị được gán |
| --- | --- | --- |
| `meta` | Tạo/đổi tên, giữ nguyên `createdAt` | Đọc |
| `desired` | Ghi sáu boolean ngõ ra | Đọc |
| `config/servo`, `config/thresholds` | Ghi cấu hình trong giới hạn | Đọc |
| `reported/outputs`, từng `reported/sensors/{sensorName}`, `reported/lastSeen` | Đọc | Ghi dữ liệu thực |
| `commands/{id}` | Tạo lệnh có TTL, không sửa/xóa riêng lẻ | Đọc |
| `acks/{id}` | Đọc | Ghi tiến trình hợp lệ |

Bể mới chỉ có `meta`: `ownerUid` khớp UID đường dẫn, `name`, `location`, `volumeLiters`, `createdAt`, `updatedAt`. Sau khi tạo bể, web tạo system với `meta`, sáu boolean `desired` và cấu hình `servo`/`thresholds`. System mới không có cảm biến, heartbeat, output thực hoặc ACK; chủ bể không được giả những dữ liệu này, kể cả khi tạo node. Timestamp tạo/cập nhật dùng thời gian máy chủ; `ownerUid` và `createdAt` không được sửa.

Chủ bể được xóa toàn bộ bể hoặc system của mình. Thiết bị mất quyền ghi khi system không còn tồn tại; quản trị viên nên thu hồi mapping khi xóa/đổi system. Không tái sử dụng ID bể/system cũ; web tạo UUID mới.

## Cấp quyền Pico W

Spark không có callable tự ghép thiết bị. Quản trị viên thực hiện trong Firebase Console hoặc công cụ Admin SDK đáng tin cậy:

1. Chủ bể đăng ký trên web, tạo bể và system. Lấy `ownerUid` trong Authentication → Users, `tankId` và `systemId` trong Realtime Database.
2. Tạo tài khoản Email/Password riêng cho mỗi Pico trong Authentication → Users; ghi lại UID là `deviceUid`. Không dùng tài khoản chủ bể cho firmware.
3. Trước khi giao mật khẩu thiết bị, tạo cờ và mapping sau. Thay các chuỗi mẫu bằng UID/ID thật; thêm đúng từng nhánh, không import JSON ở root làm ghi đè project:

```json
{
  "sparkDeviceAccounts": {
    "DEVICE_AUTH_UID": true
  },
  "sparkDevices": {
    "DEVICE_AUTH_UID": {
      "ownerUid": "OWNER_AUTH_UID",
      "tankId": "TANK_ID",
      "systemId": "SYSTEM_ID",
      "enabled": true
    }
  }
}
```

4. Cấu hình Pico với email/mật khẩu thiết bị riêng, API key Web, Database URL và ba ID đích. Firmware đăng nhập Firebase Auth, dùng ID token và làm mới token. Không đặt service account, database secret hoặc tài khoản quản trị trong firmware/frontend.
5. Khi thu hồi, đặt `sparkDevices/{deviceUid}/enabled = false` và vô hiệu hóa tài khoản Authentication. Giữ cờ `sparkDeviceAccounts/{deviceUid}=true` để phiên cũ không trở thành tài khoản chủ bể.

Nhập một UID trong trình duyệt không tự cấp quyền. Không cho chủ bể ghi mapping, vì tài khoản đó có thể tự biến thành thiết bị rồi giả dữ liệu cảm biến hoặc xác nhận lệnh.

## Hợp đồng firmware

Prefix vận hành của Pico:

```text
/sparkAquariums/OWNER_AUTH_UID/TANK_ID/systems/SYSTEM_ID
```

REST nối suffix `.json` và ID token, ví dụ đọc trạng thái mong muốn: `<DATABASE_URL><PREFIX>/desired.json?auth=<ID_TOKEN>`. Không ghi đè toàn bộ system; ghi đúng nhánh theo vai trò. Không ghi token hoặc mật khẩu vào log.

### Ngõ ra và cấu hình

`desired` và `reported/outputs` có đủ sáu khóa boolean: `airPump`, `fan`, `relay`, `led1`, `led2`, `led3`. Pico áp dụng trạng thái mong muốn vào phần cứng, sau đó ghi trạng thái thực vào `reported/outputs`. Write thành công trên Firebase chỉ xác nhận đã nhận yêu cầu; trạng thái thực phải do Pico báo.

`config/servo` gồm `minAngle`, `maxAngle`, là số nguyên 0–180 và `minAngle < maxAngle`. `config/thresholds` gồm `minWaterTemperature`, `maxWaterTemperature`, `maxTds`, `minAdapterVoltage`; nhiệt độ tối thiểu phải thấp hơn tối đa. Firmware cần chính sách an toàn khi mất mạng/khởi động lại; web không tự điều khiển ngõ ra theo ngưỡng cảnh báo.

### Heartbeat và cảm biến

Ghi `reported/lastSeen` mỗi 5–10 giây bằng `{ ".sv": "timestamp" }`. Thiếu heartbeat hoặc quá 30 giây được xem là mất liên lạc. Kết nối trình duyệt với Firebase không chứng minh Pico đang trực tuyến.

| `sensorName` | Đơn vị | Miền giá trị Rules cho phép |
| --- | --- | --- |
| `waterTemperature` | °C | -55 đến 125 |
| `ambientTemperature` | °C | 0 đến 50 |
| `humidity` | % | 0 đến 100 |
| `tds` | ppm | 0 đến 10000 |
| `adapterVoltage` | V | 0 đến 60 |

Ghi nguyên bản ghi tại từng `reported/sensors/{sensorName}`, không PUT toàn bộ `reported/sensors`. Ví dụ dữ liệu hợp lệ:

```json
{"value":27.2,"valid":true,"updatedAt":{".sv":"timestamp"}}
```

Khi đọc lỗi/chưa có dữ liệu, thay cả record để xóa `value` cũ:

```json
{"valid":false,"updatedAt":{".sv":"timestamp"}}
```

Web xem dữ liệu quá 60 giây là cũ. Miền Rules chỉ kiểm tra định dạng; TDS/điện áp vẫn cần hiệu chuẩn phần cứng.

### Lệnh một lần và ACK

`commands/{commandId}` có `id` trùng khóa UUID, `type`, `createdAt` timestamp máy chủ, `expiresAt` số nguyên mili giây UTC và `requestedBy` UID chủ bể. Với `type: "servo"`, thêm `angle` số nguyên trong cấu hình servo; với `type: "buzzer"`, thêm `durationMs` số nguyên 100–5000. Không gửi cả hai trường hoặc trường ngoài schema.

Rules yêu cầu heartbeat còn trong 30 giây và `now < expiresAt <= now + 15000`; TTL tối đa 15 giây. Web không xếp hàng hoặc tự gửi lại lệnh một lần sau mất mạng. Firmware kiểm tra TTL khi nhận backlog; không thực hiện lệnh hết hạn.

ACK tại `acks/{commandId}` gồm `status`, `processedAt` timestamp máy chủ và `message` tùy chọn tối đa 200 ký tự. Chuỗi trạng thái:

| Hiện tại | Bước tiếp theo |
| --- | --- |
| Chưa có ACK | `accepted` trước hạn, `expired` sau hạn, hoặc `error` |
| `accepted` | `executing` trước hạn, `expired` sau hạn, hoặc `error` |
| `executing` | `applied` hoặc `error` |
| `applied`, `error`, `expired` | Kết thúc, không sửa/xóa |

Firmware phải lưu ID lệnh bền vững trước tác động phần cứng, chờ xác nhận ACK `accepted`/`executing`, rồi chạy đúng một lần. Lưu kết quả trước khi ghi `applied` hoặc `error`. Sau mất mạng chỉ đồng bộ kết quả; sau reboot không chạy lại ID đã có, kể cả kết quả chưa xác định. Bộ nhớ RAM hoặc chỉ ACK trên Firebase không đủ chống replay. Chỉ ACK `applied` từ thiết bị mới xác nhận firmware đã hoàn tất.

## Hạn mức và tương thích

Spark có giới hạn kết nối, lưu trữ và băng thông Realtime Database. Kiểm tra Usage và [bảng giá Firebase](https://firebase.google.com/pricing), [giới hạn Database](https://firebase.google.com/docs/database/usage/limits) khi vận hành. Mỗi tab/thiết bị đang kết nối dùng một phần hạn mức; giới hạn kết nối không phải tổng số tài khoản. Giới hạn Vercel là riêng với Firebase.

TTL không tự xóa command/ACK. Quản trị viên cần dọn bản ghi cũ theo thời gian lưu giữ; bản này không có scheduler dọn tự động. Thông báo hiển thị khi web đang mở; chưa có push nền trên iOS.

Android/backend v2 cũ dùng `/aquariums`, membership/index và Cloud Functions. Web Spark dùng prefix/cờ cấp quyền ở tài liệu này; cùng project Firebase không tự chuyển đổi Android hoặc firmware v2. Repo này chưa có firmware Pico và việc test demo/web không chứng minh phần cứng thật hoạt động.
