# 以程式方式管理 Deno Deploy 應用程式

除了建立 microVM 之外，這個 SDK 也提供 API，可在組織內建立與管理
Deploy 應用程式。當你需要以下能力時，自動化這些流程會很有幫助：

- 建立隔離的應用程式做預覽或 QA
- 讓多個環境保持同步
- 將 Deploy 建立流程直接整合進 CI/CD
- 定期清理陳舊或未使用的應用程式

本 SDK 封裝了 [Deno Deploy REST API](https://console.deno.com/api/v2/docs)。

## 開始使用

### 驗證

你需要一個具備適當權限、可用來管理應用程式的 Deno Deploy API token。
你可以在 Deno Deploy 主控台的 **Sandboxes** > **Integrate into your app**
找到 token。

如果你還沒有 token，請點選 **+ Create Token** 按鈕建立新的 token。

在初始化客戶端或建立沙箱來管理應用程式時，請傳入
`DENO_DEPLOY_TOKEN` 環境變數，且該 token 必須限定在你的組織範圍。
`Client` 類別會針對 token 所屬組織中的每個應用程式，提供建立、列出、
取得、更新與刪除方法。

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

SDK 也使用同一個 `DENO_DEPLOY_TOKEN` 環境變數進行驗證。請提供
限定在你要管理之組織範圍內的 token。

## 建立應用程式

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

`slug` 是必填，且在組織內必須唯一。隨著 API 持續演進，之後也可提供
`name`、`description` 等選填中繼資料。

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

使用迭代即可走訪組織中的所有應用程式，不必自行管理游標。

## 取得應用程式

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

可使用 slug 或 UUID 來取得，方便直接使用手邊已有的識別碼。

## 更新應用程式中繼資料

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

當團隊重新命名服務，或你想在多個組織間強制採用一致的 slug 命名模式時，
這會很方便。

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

刪除可接受任一識別碼。刪除後，相關的建置與路由會自動清理。

## 從沙箱發佈到 Deploy 應用程式

`sandbox.deno.deploy()` 方法可用於將沙箱中的資源發佈到既有的 Deno
Deploy 應用程式。這讓你可以把沙箱當成部署到 Deno Deploy 託管應用程式
的部署管線。

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
