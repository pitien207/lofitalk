# Triển khai LofiTalk lên Azure Container Apps

Tài liệu này liệt kê những việc **bạn phải làm thủ công** để app chạy trên Azure Container Apps (ACA). Phần còn lại tự động qua GitHub Actions ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)).

## Tổng quan

```
push lên main ──► GitHub Actions ──► build Docker image ──► ghcr.io/pitien207/lofitalk:<sha>
                                   └─► azure/login (OIDC) ──► az containerapp update ──► lofitalk
Trình duyệt ──► https://lofitalk.nghiapham.org ──► Container App (web + API + Socket.IO, cổng 8080)
                                                     └─► Azure DocumentDB Free Tier (MongoDB)
                                                     └─► Anthropic API (chỉ gọi từ server, cho Tarot)
```

- **Một container duy nhất** phục vụ cả frontend (React đã build) lẫn API và WebSocket, trên cùng một domain.
- **Không lưu gì trên ổ đĩa của container:** mọi dữ liệu nằm trong MongoDB. Scale về 0 không làm mất dữ liệu.
- **Max replicas phải là 1:** phòng chat Socket.IO và lời mời game nằm trong RAM của một tiến trình.

Các lệnh dưới đây viết cho **PowerShell**. Đặt sẵn biến:

```powershell
$RG   = "<rg-ten-cua-ban>"
$APP  = "lofitalk"
$REPO = "pitien207/lofitalk"
az login
$SUB    = az account show --query id -o tsv
$TENANT = az account show --query tenantId -o tsv
```

---

## 1. Chi phí

| Thành phần | Gói | Chi phí ước tính |
|---|---|---|
| Container App | Consumption, 0.25 vCPU / 0.5 Gi, min 0, max 1 | Mỗi subscription được miễn phí hằng tháng 180.000 vCPU-giây, 360.000 GiB-giây và 2 triệu request. Với ~200 user, mỗi người ~1 lần/tuần, thường nằm trong mức miễn phí. Web tự ngắt WebSocket và dừng polling khi tab bị ẩn quá 10 phút hoặc không có thao tác trong 30 phút, nên một tab bị bỏ quên không giữ replica thức mãi. **Trường hợp xấu nhất:** nếu replica không bao giờ ngủ, khoảng 14 USD/tháng theo đơn giá tham khảo; xem lại bảng giá chính thức. |
| Azure DocumentDB | Free Tier, 32 GB | 0 USD. Không có backup tự động, bị tạm dừng nếu 60 ngày không hoạt động, mỗi subscription chỉ được 1 cluster miễn phí. |
| GitHub Container Registry | Package public | 0 USD (GitHub Packages miễn phí cho package public). Có thể xóa bớt image cũ cho gọn (mỗi lần deploy tạo một tag mới). |
| Anthropic API | `claude-haiku-5-5` | Theo token; mỗi lần xem Tarot tốn khoảng một phần mười cent. |

Không dùng Azure Container Registry, Log Analytics hay Key Vault.

---

## 2. Tạo database: Azure DocumentDB Free Tier

### 2.1 Chọn vùng
Chọn **Germany West Central**, cùng vùng với Container App:
- Không mất phí truyền dữ liệu giữa hai vùng, và độ trễ thấp nhất.
- Cluster `lofitalk-db` đã được tạo ở vùng này với gói **Free** (đã kiểm tra: `tier: Free`, 32 GB).

Free Tier chỉ có ở một số vùng và danh sách thay đổi theo thời gian. Nếu Portal không cho chọn Free Tier ở Germany West Central, hãy chọn vùng châu Âu gần nhất được phép. Khi đó sẽ có thêm một khoản phí truyền dữ liệu giữa hai vùng, ở mức vài cent mỗi tháng.

### 2.2 Tạo cluster trên Azure Portal
1. **Create a resource**, tìm **Azure DocumentDB** rồi bấm **Create**.
2. Tab **Basics**:
   - **Resource group:** có thể dùng `$RG`.
   - **Cluster name:** ví dụ `lofitalk-db`.
   - **Region:** Germany West Central.
   - **Tier:** tick **Free tier**.
   - **MongoDB version:** bản mới nhất được liệt kê.
   - **Admin:** Free Tier có thể cấp sẵn tên admin; tên thật hiển thị ở mục **Connection strings** sau khi tạo xong. Đặt mật khẩu mạnh, nên **chỉ dùng chữ và số** để khỏi phải mã hóa URL.
3. Tab **Networking**:
   - Chọn **Public access (allowed IP addresses)**.
   - Tick **Allow public access from Azure services and resources within Azure to this cluster**. Bắt buộc, vì Container App gói Consumption **không có IP outbound cố định**.
   - Bấm **Add current client IP address** để máy bạn kết nối được khi test.
4. **Review + create**, chờ vài phút.

Lưu ý bảo mật: tùy chọn "Allow Azure services" cho phép mọi địa chỉ IP thuộc Azure thử kết nối. Dữ liệu vẫn được bảo vệ bằng TLS và mật khẩu. Kết nối riêng (VNet/Private Endpoint) đòi hỏi cấu hình mạng khác và có thể phát sinh phí, nên không dùng ở đây.

Muốn thêm IP khác sau này (đổi mạng, đổi máy): cluster → **Networking** → **Add current client IP address** → **Save**.

### 2.3 Lấy connection string
Vào cluster → **Connection strings**, copy chuỗi dạng:

```
mongodb+srv://<user>:<password>@<cluster>.global.mongocluster.cosmos.azure.com/?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000
```

1. **Thay `<password>`** bằng mật khẩu thật. ⚠️ **Mật khẩu có ký tự đặc biệt** (`@ : / ? # % & +` …) **phải được mã hóa URL**, nếu không app sẽ báo lỗi xác thực hoặc lỗi phân tích URI:
   ```powershell
   [uri]::EscapeDataString('mat-khau-cua-ban')
   ```
2. **Thêm tên database** `lofitalk` ngay trước dấu `?`:
   ```
   ...cosmos.azure.com/lofitalk?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000
   ```
3. **Giữ nguyên** `tls=true`, `authMechanism=SCRAM-SHA-256` và `retrywrites=false`, vì DocumentDB cần các tham số này. Code không cần sửa gì thêm.

Đây là giá trị cho `MONGO_URI`.

### 2.4 Test kết nối từ máy bạn
- **MongoDB Compass:** New connection, dán URI, Connect.
- **mongosh:**
  ```powershell
  mongosh "mongodb+srv://<user>:<pass>@<cluster>.global.mongocluster.cosmos.azure.com/lofitalk?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false"
  ```
  Sau đó chạy `db.runCommand({ ping: 1 })`, kết quả phải là `{ ok: 1 }`.
- **Chạy backend local với DocumentDB:** tạm đổi `MONGO_URI` trong `backend/.env`, chạy `npm run dev` trong `backend/`, rồi đăng ký, đăng nhập và chat thử. Xong thì đổi lại.

### 2.5 Độ tương thích (đã kiểm tra)
Code hiện tại dùng: `find`/`findOne`/`findOneAndUpdate`, `aggregate` với `$match` + `$sample` + `$project`, các toán tử `$in $nin $ne $or $gt $gte $lt $exists $all $set $inc $addToSet $pull`, unique index, compound index và TTL index (`expireAt` của thông báo admin và announcement).

- **Được hỗ trợ:** tất cả các thứ trên, theo bảng tương thích của DocumentDB.
- **Code không dùng:** transaction, change stream, text index, lệnh `bulkWrite` (lệnh này DocumentDB không hỗ trợ).

---

## 3. Chạy thử image Docker trên máy

Cần Docker Desktop. Ví dụ dưới đây dùng MongoDB local trong container `lofitalk-mongo`; muốn thử với DocumentDB thì thay `MONGO_URI`.

```powershell
docker build -t lofitalk:local .
docker run --rm -p 8080:8080 `
  -e MONGO_URI="mongodb://host.docker.internal:27017/lofitalk" `
  -e JWT_SECRET_KEY="chi-dung-de-test-local" `
  -e FRONTEND_URLS="http://localhost:8080" `
  -e ASSET_BASE_URL="http://localhost:8080" `
  -e ANTHROPIC_API_KEY="$env:ANTHROPIC_API_KEY" `
  lofitalk:local
```

Mở http://localhost:8080. Kiểm tra nhanh:

```powershell
curl.exe -s http://localhost:8080/api/meta/version
```

Kết quả đúng là `{"mobileAppVersion":null}`. Dừng container bằng `Ctrl+C`.

---

## 4. Cho GitHub Actions đăng nhập Azure bằng OIDC (không dùng client secret)

### 4.1 Tạo app registration và service principal
```powershell
$APP_ID = az ad app create --display-name "github-lofitalk-deploy" --query appId -o tsv
$SP_ID  = az ad sp create --id $APP_ID --query id -o tsv
```

### 4.2 Tạo federated credential cho nhánh `main`
```powershell
$fic = @"
{
  "name": "github-lofitalk-main",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:$REPO`:ref:refs/heads/main",
  "audiences": ["api://AzureADTokenExchange"]
}
"@
[System.IO.File]::WriteAllText("$PWD\fic.json", $fic)
az ad app federated-credential create --id $APP_ID --parameters fic.json
Remove-Item fic.json
```

Chỉ workflow chạy từ nhánh `main` của repo `pitien207/lofitalk` mới đăng nhập được.

### 4.3 Gán quyền tối thiểu
Gán vai trò **Container Apps Contributor** trên resource group. Vai trò này chỉ quản lý tài nguyên `Microsoft.App`, nên không chạm được vào database hay tài nguyên khác.

```powershell
az role assignment create `
  --assignee-object-id $SP_ID --assignee-principal-type ServicePrincipal `
  --role "Container Apps Contributor" `
  --scope "/subscriptions/$SUB/resourceGroups/$RG"
```

- **Quyền đọc secret:** vai trò này cho phép đọc secret của Container App. `az containerapp update` cần quyền đó để giữ nguyên secret khi cập nhật.
- **Nếu workflow báo `AuthorizationFailed`:** lỗi sẽ ghi tên action còn thiếu (ví dụ `Microsoft.App/managedEnvironments/join/action`). Gửi lỗi đó để chọn cách cấp thêm quyền hẹp nhất.

### 4.4 Thêm secrets và variables vào GitHub
Vào repo → **Settings → Secrets and variables → Actions**.

| Loại | Tên | Giá trị |
|---|---|---|
| Secret | `AZURE_CLIENT_ID` | `$APP_ID` |
| Secret | `AZURE_TENANT_ID` | `$TENANT` |
| Secret | `AZURE_SUBSCRIPTION_ID` | `$SUB` |
| Variable | `AZURE_RESOURCE_GROUP` | `$RG` |

Hoặc dùng GitHub CLI:
```powershell
gh secret set AZURE_CLIENT_ID --repo $REPO --body $APP_ID
gh secret set AZURE_TENANT_ID --repo $REPO --body $TENANT
gh secret set AZURE_SUBSCRIPTION_ID --repo $REPO --body $SUB
gh variable set AZURE_RESOURCE_GROUP --repo $REPO --body $RG
```

Không cần thêm token cho ghcr.io: workflow dùng `GITHUB_TOKEN` có sẵn với quyền `packages: write`.

---

## 5. Cho Container App pull image từ ghcr.io (package public)

Repo `pitien207/lofitalk` là **public** và image không chứa secret nào (không có `.env`, key hay chứng chỉ; secret chỉ được đưa vào lúc chạy qua secret của Container App). Vì vậy package ghcr.io được để **public**: Container App pull mà không cần đăng nhập, **không cần PAT hay registry credential**, nên cũng không có token nào phải gia hạn.

Package được tạo ở lần push đầu tiên (mục 7) và mặc định là **private**, nên làm như sau:
1. Push lên `main`. Bước build và push image thành công, nhưng bước deploy **có thể lỗi** vì Container App chưa được phép pull image private. Đây là điều bình thường ở lần đầu.
2. Vào GitHub → hồ sơ `pitien207` → **Packages** → `lofitalk` → **Package settings**:
   - Ở **Danger Zone**, chọn **Change visibility → Public**, rồi gõ tên package để xác nhận.
   - Kiểm tra package đã được liên kết với repo `lofitalk` (workflow gắn sẵn label `org.opencontainers.image.source` để tự liên kết).
3. Kiểm tra: lệnh sau phải tải được image mà không cần đăng nhập:
   ```powershell
   docker logout ghcr.io
   docker pull ghcr.io/pitien207/lofitalk:latest
   ```
4. Mở lần chạy workflow bị lỗi trong tab **Actions** → **Re-run failed jobs**. Từ đó trở đi, mọi lần push đều deploy bình thường.

**Tự dọn image cũ:** sau mỗi lần deploy thành công, workflow chỉ giữ **10 image mới nhất** trên ghcr.io (đủ để quay về 10 lần deploy gần nhất, xem mục 7). Bước này lỗi cũng không làm hỏng deploy. Nếu log báo thiếu quyền xóa, vào **Package settings → Manage Actions access**, cấp cho repo `lofitalk` quyền **Admin**.

⚠️ **Không đổi lại được:** GitHub không cho chuyển package public về private. Đừng bao giờ đưa secret vào image. `.dockerignore` đã loại mọi file `.env` và `.env.*`; secret chỉ đặt trong Container App (mục 6).

---

## 6. Cấu hình Container App

Làm trên Portal (Container App `lofitalk`) hoặc bằng CLI. **Nên làm hết bước này trước lần push đầu tiên lên `main`.**

### 6.1 Secrets
Trên Portal: **Settings → Secrets → Add**. Tên secret chỉ gồm chữ thường, số và dấu `-`.

| Secret | Giá trị |
|---|---|
| `mongo-uri` | Connection string DocumentDB ở mục 2.3 |
| `jwt-secret-key` | Chuỗi ngẫu nhiên dài, tạo bằng `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `anthropic-api-key` | API key Anthropic |
| `mail-pass` | **Bắt buộc**: mật khẩu SMTP (Gmail App Password hoặc SMTP key). Không có thì không đăng ký được và không đặt lại mật khẩu được. |
| `vapid-private-key` | Không bắt buộc: khóa riêng cho thông báo đẩy (mục 6.5) |

Nên nhập `mongo-uri` trên **Portal**: chuỗi có ký tự `&`, dễ bị PowerShell và `az.cmd` cắt sai. Các secret còn lại có thể dùng CLI:

```powershell
az containerapp secret set --name $APP --resource-group $RG `
  --secrets jwt-secret-key="<chuoi-ngau-nhien>" anthropic-api-key="<key>"
```

### 6.2 Biến môi trường
Trên Portal: **Application → Containers → Edit and deploy → Environment variables**.

| Tên | Nguồn | Giá trị |
|---|---|---|
| `MONGO_URI` | Reference a secret | `mongo-uri` |
| `JWT_SECRET_KEY` | Reference a secret | `jwt-secret-key` |
| `ANTHROPIC_API_KEY` | Reference a secret | `anthropic-api-key` |
| `ANTHROPIC_MODEL` | Manual | `claude-haiku-5-5` (không bắt buộc, đây là mặc định) |
| `FRONTEND_URLS` | Manual | `https://lofitalk.nghiapham.org` |
| `ASSET_BASE_URL` | Manual | `https://lofitalk.nghiapham.org` |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_SECURE`, `MAIL_USER`, `MAIL_FROM` | Manual | **Bắt buộc**: dùng để gửi mã xác nhận đăng ký và mã đặt lại mật khẩu. Gmail: `smtp.gmail.com`, `465`, `true`. |
| `MAIL_PASS` | Reference a secret | `mail-pass` |
| `VAPID_PUBLIC_KEY`, `VAPID_SUBJECT` | Manual | Không bắt buộc, xem mục 6.5 |
| `VAPID_PRIVATE_KEY` | Reference a secret | `vapid-private-key` |

`NODE_ENV=production` và `PORT=8080` đã có sẵn trong image, không cần đặt.

Bằng CLI:
```powershell
az containerapp update --name $APP --resource-group $RG `
  --set-env-vars MONGO_URI=secretref:mongo-uri JWT_SECRET_KEY=secretref:jwt-secret-key `
    ANTHROPIC_API_KEY=secretref:anthropic-api-key ANTHROPIC_MODEL=claude-haiku-5-5 `
    FRONTEND_URLS=https://lofitalk.nghiapham.org ASSET_BASE_URL=https://lofitalk.nghiapham.org `
  --min-replicas 0 --max-replicas 1
```

### 6.3 Ingress, scale, CPU/RAM
| Mục | Giá trị |
|---|---|
| Ingress | Enabled, **Accepting traffic from anywhere** |
| Insecure connections | Tắt (chỉ HTTPS) |
| **Target port** | **8080** (image quickstart đang dùng 80) |
| Transport | **Auto** (WebSocket của Socket.IO hoạt động qua HTTP/1.1) |
| Min / **Max replicas** | 0 / **1** |
| CPU / Memory | 0.25 vCPU / 0.5 Gi là đủ |
| Custom domain | Giữ nguyên `lofitalk.nghiapham.org` với managed certificate |

```powershell
az containerapp ingress update --name $APP --resource-group $RG --target-port 8080 --transport auto
```

Khi đổi target port sang 8080, image quickstart hiện tại sẽ ngừng phản hồi cho tới khi image mới được deploy. Đây là bình thường, vì quickstart chỉ là trang giữ chỗ.

### 6.4 Health probe (không bắt buộc, miễn phí)
Backend có hai endpoint:

| Endpoint | Ý nghĩa |
|---|---|
| `GET /api/health` | Process còn sống (không chạm database). Dùng cho **liveness** và **startup** probe. |
| `GET /api/health/ready` | Ping database (timeout 3 giây): 200 khi DB sẵn sàng, 503 khi không. Dùng cho **readiness** probe. |

Trên Portal: **Application → Containers → Edit and deploy → chọn container → Health probes**:

| Probe | Path | Port | Gợi ý |
|---|---|---|---|
| Startup | `/api/health` | 8080 | period 5 s, failure threshold 12 (cho phép khởi động tới 60 s) |
| Liveness | `/api/health` | 8080 | period 30 s, failure threshold 3 |
| Readiness | `/api/health/ready` | 8080 | period 15 s, failure threshold 3 |

Không nên dùng `/api/health/ready` cho liveness: DB chậm một lúc sẽ khiến container bị khởi động lại vô ích.

### 6.5 Thông báo đẩy (Web Push, miễn phí, không bắt buộc)
Người dùng bật **Thông báo tin nhắn** ở trang Hồ sơ thì sẽ nhận thông báo của trình duyệt khi có tin nhắn mới lúc đã đóng LofiTalk. Server chỉ gửi khi người nhận không mở app. Nếu không đặt 3 biến dưới đây thì tính năng tắt và mục cài đặt bị ẩn.

1. Tạo cặp khóa **một lần** trên máy bạn (không commit, không dán vào chat):
   ```powershell
   cd backend
   npx web-push generate-vapid-keys
   ```
2. Lưu khóa riêng thành secret `vapid-private-key` (mục 6.1), rồi đặt biến môi trường `VAPID_PRIVATE_KEY=secretref:vapid-private-key`, `VAPID_PUBLIC_KEY=<khóa công khai>` và `VAPID_SUBJECT=mailto:<email của bạn>`.
3. **Không đổi khóa** sau khi đã dùng: đổi khóa thì mọi trình duyệt đã bật phải bật lại.

Ghi chú: trên iPhone/iPad, thông báo đẩy chỉ chạy khi người dùng **Thêm vào màn hình chính** rồi mở LofiTalk từ đó (app có manifest và icon nên cài được như PWA).

### 6.6 Proxy và rate limit
App đặt `trust proxy` = 1 hop (ingress của Container Apps) để lấy đúng IP người dùng cho rate limit. Chỉ đổi khi có thêm proxy phía trước (ví dụ Cloudflare proxy bật) bằng biến `TRUST_PROXY_HOPS`. Bộ đếm rate limit nằm trong RAM, reset mỗi khi container khởi động lại.

---

## 7. Deploy

1. Commit và push lên `main`. Workflow **Build and deploy to Azure Container Apps** sẽ:
   - Chạy test backend (`npm test` với một MongoDB 7 tạm trong CI). Test lỗi thì **không** deploy.
   - Build image và push lên `ghcr.io/pitien207/lofitalk` với tag `latest` và tag `<commit-sha>`.
   - Đăng nhập Azure bằng OIDC.
   - Chạy `az containerapp update --image ghcr.io/pitien207/lofitalk:<commit-sha>`.
2. Theo dõi trong tab **Actions**. Muốn chạy lại thủ công: **Run workflow**.
   **Lần push đầu tiên:** nếu bước deploy lỗi vì package còn private, làm theo mục 5 (đổi package sang Public) rồi bấm **Re-run failed jobs**.
3. **Xem log trực tiếp** (không cần Log Analytics; log không được lưu lại):
   ```powershell
   az containerapp logs show --name $APP --resource-group $RG --follow --tail 50
   az containerapp logs show --name $APP --resource-group $RG --type system --tail 50
   ```
   Log khởi động đúng gồm `MongoDB connected: ...`, `Server is running on 0.0.0.0:8080` và `Indexes ensured for 11/11 models`.
4. **Quay về bản cũ:**
   ```powershell
   az containerapp update --name $APP --resource-group $RG --image ghcr.io/pitien207/lofitalk:<sha-cu>
   ```

### Kiểm tra sau khi deploy
| Kiểm tra | Kết quả đúng |
|---|---|
| `https://lofitalk.nghiapham.org/api/meta/version` | HTTP 200 |
| `https://lofitalk.nghiapham.org/api/health/ready` | HTTP 200, `"database":"up"` |
| Mở `https://lofitalk.nghiapham.org/login` rồi tải lại trang | Không bị lỗi 404 |
| DevTools → Network | Mọi request đi tới `lofitalk.nghiapham.org` |
| Đăng ký tài khoản đầu tiên (database đang rỗng), đăng nhập, tải lại trang | Vẫn giữ đăng nhập |
| Chat giữa 2 tài khoản (một ở cửa sổ ẩn danh) | Tin nhắn hiện ngay; tab WS có `/socket.io/` trạng thái 101 |
| Gợi ý bạn bè, kết bạn | Hoạt động |
| Tarot | Ra kết quả; nếu lỗi, client chỉ thấy thông báo chung, chi tiết nằm trong log |
| Để app nghỉ hơn 10 phút rồi mở lại | Lần đầu chậm vài giây (cold start), sau đó bình thường |

---

## 8. Database rỗng: index và admin đầu tiên

DocumentDB bắt đầu **rỗng**, không chuyển dữ liệu cũ.

- **Không cần dữ liệu khởi tạo:** collection được tạo tự động khi có dữ liệu đầu tiên. Thống kê lượt dùng tự tạo khi cần; avatar và lời bánh may mắn nằm sẵn trong image.
- **Index tự tạo khi khởi động:** mỗi lần container khởi động, backend tạo đầy đủ index (unique `email`, `roomKey`, `key`; compound cho chat; TTL cho thông báo admin và announcement). Việc này an toàn khi chạy lặp lại. Trong log phải thấy:
  ```
  Indexes ensured for 11/11 models
  ```
  Nếu có dòng `Index creation failed: ...`, hãy gửi lại nội dung lỗi.
- **Admin đầu tiên (chỉ cần nếu dùng trang quản trị):** app không cho tạo admin từ giao diện. Cách tạo:
  1. Đăng ký một tài khoản bình thường trên `https://lofitalk.nghiapham.org`.
  2. Từ máy bạn (IP đã được thêm ở mục 2.2), chạy script [backend/scripts/make-admin.js](backend/scripts/make-admin.js). Chạy lại nhiều lần cũng không sao:
     ```powershell
     cd backend
     $env:MONGO_URI = "<connection string DocumentDB có /lofitalk>"
     node scripts/make-admin.js email-cua-ban@example.com
     Remove-Item Env:MONGO_URI
     ```
  3. Đăng xuất rồi đăng nhập lại để thấy trang quản trị.

---

## 9. App mobile (làm sau)

Chưa làm ở đợt này. **Hiện không đặt `MOBILE_APP_VERSION`** trên Container App.

Ghi chú cho lần sau:
- **URL server:** nằm ở một chỗ duy nhất, [mobile/src/config.js](mobile/src/config.js) (mặc định `https://lofitalk.nghiapham.org`). Khi chạy local, đặt `EXPO_PUBLIC_SERVER_URL=http://<IP-LAN>:5001` trong `mobile/.env`.
- **Cơ chế bắt buộc cập nhật:**
  - App gọi `GET /api/meta/version` và so sánh `MOBILE_APP_VERSION` của backend với `version` trong [mobile/app.json](mobile/app.json). Chỉ cần khác nhau là app hiện màn hình "Please update LofiTalk".
  - Nút tải mở link `EXPO_PUBLIC_MOBILE_UPDATE_URL`, link này được đóng gói vào app lúc build.
  - `MOBILE_APP_VERSION` để trống thì không chặn.
  - Chỉ đặt biến này **sau khi** bản mới đã có link tải.
- **Build APK:** dùng EAS, profile `production` ra file APK:
  ```powershell
  npm install -g eas-cli
  eas login
  cd mobile
  npm ci
  eas build --platform android --profile production
  ```
  Sau đó tải APK trên expo.dev và cài thử trước khi gửi cho người dùng.

---

## Tham khảo
- [Azure DocumentDB Free Tier](https://learn.microsoft.com/azure/documentdb/free-tier)
- [Độ tương thích MongoDB của DocumentDB](https://learn.microsoft.com/azure/documentdb/compatibility-query-language)
- [Giá Azure Container Apps](https://azure.microsoft.com/pricing/details/container-apps/)
- [Vai trò dựng sẵn cho Containers](https://learn.microsoft.com/azure/role-based-access-control/built-in-roles/containers)
- [Quản lý secret trong Container Apps](https://learn.microsoft.com/azure/container-apps/manage-secrets)
- [Danh sách vùng Azure](https://learn.microsoft.com/azure/reliability/regions-list)
