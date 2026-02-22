# 沙箱超時

Deno Sandbox 創建的沙箱故意是短暫的。他們啟動
毫秒，達到目的，然後消失－減少爆炸半徑
不受信任的代碼並消除基礎設施的雜務。不過你還是可以控制的
沙箱準確地保持活動狀態，甚至稍後在調試時重新連接
是必須的。

## 預設逾時：`"session"`

```
await using sandbox = await Sandbox.create();
```

```
from deno_sandbox import DenoDeploy

sdk = DenoDeploy()

with sdk.sandbox.create() as sandbox:
  print(f"Sandbox {sandbox.id} is ready.")
```

```
from deno_sandbox import AsyncDenoDeploy

sdk = AsyncDenoDeploy()

async with sdk.sandbox.create() as sandbox:
  print(f"Sandbox {sandbox.id} is ready.")
```

如果未設定任何選項，沙箱將在腳本運行期間一直存在。一旦
沙箱執行個體關閉，microVM 關閉並釋放所有資源。這
保持成本可預測並防止孤立的基礎設施。

## 基於持續時間的超時

提供持續時間字串以在客戶端斷開連接後使沙箱保持活動：

```
const sandbox = await Sandbox.create({ timeout: "5m" });
const id = sandbox.id;
await sandbox.close(); // process can exit now

// later
const reconnected = await Sandbox.connect({ id });
```

```
sdk = DenoDeploy()

with sdk.sandbox.create(timeout="5m") as sandbox:
  sandbox_id = sandbox.id
  sandbox.close()  # process can exit now

# later
with sdk.sandbox.connect(sandbox_id) as reconnected:
  print(f"Reconnected to {reconnected.id}")
```

```
sdk = AsyncDenoDeploy()

async with sdk.sandbox.create(timeout="5m") as sandbox:
  sandbox_id = sandbox.id
  await sandbox.close()  # process can exit now

# later
async with sdk.sandbox.connect(sandbox_id) as reconnected:
  print(f"Reconnected to {reconnected.id}")
```

支援的後綴：`s`（秒）和 `m`（分鐘）。範例：`"30s"`、`"5m"`、
`"90s"`。使用此模式進行手動檢查、SSH 調試或機器人需要時
中途恢復工作。

如果您需要更長的逾時時間，可以將基於持續時間的 [`sandbox.deno.deploy()`](promote.md) 沙箱升級為 Deno Deploy 應用程式。

## 強制結束沙箱

- `await sandbox.kill()` 立即停止虛擬機器並釋放生命週期，如果
  你需要在它自然過期之前把它拆掉。
- 終止沙箱會使暴露的 HTTP URL、SSH 會話和任何
  附加卷，但是當您的程式碼刪除
  對沙箱的最後一次引用或配置的持續時間已過。

## 延長沙箱的超時時間

為正在運行的沙箱添加更多時間，而無需中斷正在進行的進程。

```
const newTimeout = await sandbox.extendTimeout("30m");
console.log(`Sandbox now expires at ${newTimeout}`);
```

```
deno sandbox extend sbx_ord_abc123def456 30m
```

當沙箱的
過期時間已更新。

## 相關API

- [`Sandbox.create()`](create.md) – 傳遞 `timeout` 選項
  時傳入。
- `Sandbox.connect({ id })` – 恢復對基於持續時間的沙箱的控制。
- `Sandbox.kill()` – 提前終止。
- [`Expose HTTP`](expose_http.md) 和 [`SSH`](ssh.md) – 請注意，其
  URL／憑證會隨沙箱生命週期結束而失效。
