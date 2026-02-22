# Deno Deploy 應用程式的程式設計管理

除了配置 microVM 之外，此 SDK 還提供用於建立和管理的 API
在組織內部Deploy 應用程式。自動化這些工作流程可以在以下情況下提供協助：
你需要：

- 啟動獨立的應用程式以進行預覽或品質檢查
- 保持多個環境同步
- 將 Deploy 設定直接整合到您的 CI/CD 中
- 按計劃清理陳舊或未使用的應用程序

SDK 封裝了 [Deno Deploy REST API](https://console.deno.com/api/v2/docs)。

## 入門

### 驗證

您將需要具有適當管理權限的 Deno Deploy API Token
應用程式.您可以在 Deno Deploy 主控台的 **Sandboxes** > 下找到您的Token
**整合到您的應用程式中**。

如果您沒有，請按一下 **+ 建立Token** 按鈕以產生新Token
還有一個。

傳遞 `DENO_DEPLOY_TOKEN` 環境變量，範圍僅限於您的組織，
當實例化客戶端或建立沙箱來管理應用程式。 `Client`
類別公開每個應用程式的建立、清單、檢索、更新和刪除方法
屬於Token範圍內的組織。

### 初始化客戶端

```
import { Client } from "@deno/sandbox";

const client = new Client();
```

```
from deno_sandbox import DenoDeploy

sdk = DenoDeploy()
```

```
from deno_sandbox import AsyncDenoDeploy

sdk = AsyncDenoDeploy()
```

SDK 使用相同的 `DENO_DEPLOY_TOKEN` 環境變量
驗證。提供您要管理的組織範圍內的Token。

## 創建一個應用程式

```
const app = await client.apps.create({
  slug: "my-app-from-sdk",
});

console.log(app);
// {
//   id: "4416a358-4a5f-45b2-99b5-3ebcb4b63b5f",
//   slug: "my-app-from-sdk",
//   updated_at: "2025-11-25T05:29:08.777Z",
//   created_at: "2025-11-25T05:29:08.777Z"
// }
```

```
app = sdk.apps.create(slug="my-app-from-sdk")

print(app)
# {
#   "id": "4416a358-4a5f-45b2-99b5-3ebcb4b63b5f",
#   "slug": "my-app-from-sdk",
#   "updated_at": "2025-11-25T05:29:08.777Z",
#   "created_at": "2025-11-25T05:29:08.777Z"
# }
```

```
app = await sdk.apps.create(slug="my-app-from-sdk")

print(app)
# {
#   "id": "4416a358-4a5f-45b2-99b5-3ebcb4b63b5f",
#   "slug": "my-app-from-sdk",
#   "updated_at": "2025-11-25T05:29:08.777Z",
#   "created_at": "2025-11-25T05:29:08.777Z"
# }
```

`slug` 是必需的，且在組織內必須是唯一的。你也會
能夠提供可選的元數據，例如 `name` 和 `description` 作為 API
進化。

## 列出應用程式

```
const list = await client.apps.list();
console.log(list.items); // first page (30 newest apps)

for await (const app of list) {
  console.log(app.slug); // paginated iterator
}
```

```
page = sdk.apps.list()
print(page.items)  # first page (30 newest apps)

for item in page.items:
  print(item["slug"])
```

```
page = await sdk.apps.list()
print(page.items)  # first page (30 newest apps)

async for item in page:
  print(item["slug"])  # paginated iterator
```

使用迭代來遍歷組織中的每個應用程序，而無需管理遊標
你自己。

## 檢索應用程式

```
const appBySlug = await client.apps.get("my-app-from-sdk");
const appById = await client.apps.get("bec265c1-ed8e-4a7e-ad24-e2465b93be88");
```

```
app_by_slug = sdk.apps.get("my-app-from-sdk")
app_by_id = sdk.apps.get("bec265c1-ed8e-4a7e-ad24-e2465b93be88")
```

```
app_by_slug = await sdk.apps.get("my-app-from-sdk")
app_by_id = await sdk.apps.get("bec265c1-ed8e-4a7e-ad24-e2465b93be88")
```

抓取支援 slug 或 UUID，方便使用
您手邊有識別符。

## 更新應用程式元數據

```
const updated = await client.apps.update(
  "bec265c1-ed8e-4a7e-ad24-e2465b93be88",
  { slug: "my-cool-app" },
);
console.log(updated.slug); // "my-cool-app"
```

```
updated = sdk.apps.update(
  "bec265c1-ed8e-4a7e-ad24-e2465b93be88",
  slug="my-cool-app"
)
print(updated["slug"])  # "my-cool-app"
```

```
updated = await sdk.apps.update(
  "bec265c1-ed8e-4a7e-ad24-e2465b93be88",
  slug="my-cool-app"
)
print(updated["slug"])  # "my-cool-app"
```

當團隊重新命名服務或您想要強制執行一致時，這很方便
跨組織的 slug 模式。

## 刪除應用程式

```
await client.apps.delete("legacy-chaotic-app");
await client.apps.delete("bec265c1-ed8e-4a7e-ad24-e2465b93be88");
```

```
sdk.apps.delete("legacy-chaotic-app")
sdk.apps.delete("bec265c1-ed8e-4a7e-ad24-e2465b93be88")
```

```
await sdk.apps.delete("legacy-chaotic-app")
await sdk.apps.delete("bec265c1-ed8e-4a7e-ad24-e2465b93be88")
```

刪除接受任一標識符。刪除後，關聯的建置和路由
會自動清理。

## 從沙箱發佈到 Deploy 應用程式

`sandbox.deno.deploy()` 方法可用來從
沙箱到現有的 Deno Deploy 應用程式。這允許您使用沙箱作為
Deno Deploy 上託管的應用程式的Deploy管道。

```
await using sandbox = await Sandbox.create();

// ... build your application ...

const app = await sandbox.deno.deploy("my-app", {
  options: {
    path: "build-output", // optional: path to the directory containing the application to deploy
    production: true, // optional: deploy to production
    build: {
      entrypoint: "server.ts", // optional: entrypoint to deploy
    },
  },
});

console.log(`Deployed to ${app.slug}`);
```

```
sdk = DenoDeploy()

with sdk.sandbox.create() as sandbox:
  # ... build your application ...

  build = sandbox.deno.deploy(
    "my-app",
    path="build-output",  # optional: path to the directory containing the application to deploy
    production=True,  # optional: deploy to production
    entrypoint="server.ts",  # optional: entrypoint to deploy
  )

  print(f"Deployed revision ID: {build.id}")
```

```
sdk = AsyncDenoDeploy()

async with sdk.sandbox.create() as sandbox:
  # ... build your application ...

  build = await sandbox.deno.deploy(
    "my-app",
    path="build-output",  # optional: path to the directory containing the application to deploy
    production=True,  # optional: deploy to production
    entrypoint="server.ts",  # optional: entrypoint to deploy
  )

  print(f"Deployed revision ID: {build.id}")
```
