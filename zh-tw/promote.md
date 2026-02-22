# 將 Deno Sandbox 升級為 Deploy 應用程式

有時，Deno Sandbox可能會證明一個概念或原型應該
作為一流的 Deno Deploy 應用程式繼續存在。而不是重建程式碼庫
在其他地方，您可以直接使用 `sandbox.deno.deploy()` 來升級沙箱。

## 臨時計算與Deploy 應用程式

|方面| Deno Sandbox | Deno Deploy 應用程式 |
| --- | --- | --- |
|終身|秒到分鐘|始終在線、託管的Deploy |
|控制平面|透過 SDK 編程 |主控台 + CI/CD |
|使用案例 |代理、預覽、不受信任的程式碼 |生產 API，長期服務 |
|狀態|短暫（需要時使用磁碟區）|使用 KV、資料庫進行持久Deploy |
|曝光|每個沙箱 `exposeHttp()`/`exposeSsh()` |自訂域、TLS、內建路由 |

從沙箱開始快速迭代。一旦程式碼庫穩定並需要
24/7 可用性，將其升級為 Deploy 應用程序，在其中建置、Deploy和Deploy
可觀察性已為您管理。

## 透過 `sandbox.deno.deploy()` 進行宣傳

當沙箱證明了這個概念時，您可以將其變成永遠在線的 Deploy 應用程式
無需在其他地方重建。 `sandbox.deno.deploy()` 快照目前文件
系統，繼承網路策略，並為應用程式提供持久的 URL，
可觀察性和團隊存取。

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

推廣理由：

- 透過生產 SLA 保持針對客戶流量的沙箱實驗運作。
- 為您處理 TLS、自訂網域、回滾和流量分割。
- 透過Deploy UI 在整個團隊中共享可觀察性（日誌/追蹤/指標）。
- 更換脆弱的交接裝置；確切的沙箱狀態變為已Deploy
  修訂。

使用沙箱進行快速、短暫的工作，然後在下列情況下呼叫 `sandbox.deno.deploy()`
程式碼應該作為託管服務存在。
