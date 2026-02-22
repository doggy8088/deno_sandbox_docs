# 將 Deno Sandbox 升級為 Deploy 應用程式

有些時候，Deno Sandbox 中驗證成功的概念或原型，會值得繼續作為正式的
Deno Deploy 應用程式運行。你不必在其他地方重建整個程式碼庫，可以直接用
`sandbox.deno.deploy()` 將沙箱升級。

## 臨時計算 vs Deploy 應用程式

| 方面 | Deno Sandbox | Deno Deploy 應用程式 |
| --- | --- | --- |
| 存活時間 | 秒到分鐘 | 常駐運行、受管理的 rollout |
| 控制平面 | 透過 SDK 以程式方式操作 | Dashboard + CI/CD |
| 使用情境 | Agents、預覽、不受信任程式碼 | 正式 API、長期運行服務 |
| 狀態 | 暫時性（需要時可用磁碟區） | 透過 KV、資料庫提供持久化部署 |
| 對外暴露 | 每個沙箱各自 `exposeHttp()`/`exposeSsh()` | 內建自訂網域、TLS、路由 |

先在沙箱中快速迭代。當程式碼庫穩定且需要 24/7 可用性時，再將它升級為
Deploy 應用程式，讓建置、rollout 與可觀測性都由平台代管。

## 使用 `sandbox.deno.deploy()` 升級

當沙箱已驗證概念可行時，你可以不必在別處重建，直接把它變成常駐的 Deploy
應用程式。`sandbox.deno.deploy()` 會對目前檔案系統建立快照、沿用網路策略，
並為應用程式建立持久 URL、可觀測性與團隊存取能力。

```
await using sandbox = await Sandbox.create({ timeout: "10m" });
// ...build or scaffold your service...

const app = await sandbox.deno.deploy("ai-preview", {
  entrypoint: "server.ts",
});
console.log(`Promoted to Deploy app ${app.slug}`);
```

```
from deno_sandbox import DenoDeploy

sdk = DenoDeploy()

with sdk.sandbox.create(timeout="10m") as sandbox:
  # ...build or scaffold your service...

  build = sandbox.deno.deploy("ai-preview", entrypoint="server.ts")
  print(f"Promoted to Deploy app, revision ID: {build.id}")
```

```
from deno_sandbox import AsyncDenoDeploy

sdk = AsyncDenoDeploy()

async with sdk.sandbox.create(timeout="10m") as sandbox:
  # ...build or scaffold your service...

  build = await sandbox.deno.deploy("ai-preview", entrypoint="server.ts")
  print(f"Promoted to Deploy app, revision ID: {build.id}")
```

升級的理由：

- 讓沙箱中的實驗以正式 SLA 持續承接客戶流量。
- 由平台代你處理 TLS、自訂網域、回滾與流量分流。
- 透過 Deploy UI 在團隊內共享可觀測性（logs/traces/metrics）。
- 取代脆弱的交接流程；沙箱當下的精確狀態會成為已部署修訂版本。

沙箱適合快速、短暫的工作；當程式碼應該作為受管理服務持續運行時，再呼叫
`sandbox.deno.deploy()`。
