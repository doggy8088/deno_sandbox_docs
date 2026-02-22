# 沙箱逾時

Deno Sandbox 建立的沙箱刻意設計為短暫存活。它們會在毫秒內啟動、
完成任務後消失，藉此降低不受信任程式碼的影響範圍，並減少基礎設施維運
雜務。不過，你仍然可以精準控制沙箱存活多久，甚至在需要除錯時稍後重新連線。

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

若未設定任何選項，沙箱會在你的腳本執行期間持續存在。當沙箱執行個體
關閉後，microVM 會關機並釋放所有資源。這可讓成本維持可預測，並避免
產生孤兒基礎設施。

## 基於持續時間的逾時

提供持續時間字串，可在用戶端中斷連線後讓沙箱繼續存活：

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

支援的後綴：`s`（秒）與 `m`（分鐘）。例如：`"30s"`、`"5m"`、
`"90s"`。這個模式適合用於人工檢查、SSH 除錯，或機器人需要中途續作時。

如果你需要更長的逾時時間，可以使用 [`sandbox.deno.deploy()`](promote.md)
將基於持續時間的沙箱升級為 Deno Deploy 應用程式。

## 強制結束沙箱

- `await sandbox.kill()` 會立即停止 VM 並釋放生命週期，適合在沙箱自然過期前
  就提前拆除。
- 終止沙箱會讓已公開的 HTTP URL、SSH 工作階段與任何掛載的磁碟區失效；
  不過，當你的程式碼釋放對沙箱的最後一個參考，或設定的持續時間到期時，
  也會自動發生相同情況。

## 延長沙箱的逾時時間

為正在運行的沙箱添加更多時間，而無需中斷正在進行的進程。

```
const newTimeout = await sandbox.extendTimeout("30m");
console.log(`Sandbox now expires at ${newTimeout}`);
```

```
deno sandbox extend sbx_ord_abc123def456 30m
```

在更新沙箱的到期時間時，所有現有連線與程序都會持續運作，不會中斷。

## 相關 API

- [`Sandbox.create()`](create.md) – 建立時傳入 `timeout` 選項。
- `Sandbox.connect({ id })` – 恢復對基於持續時間的沙箱的控制。
- `Sandbox.kill()` – 提前終止。
- [`Expose HTTP`](expose_http.md) 和 [`SSH`](ssh.md) – 請注意，其
  URL／憑證會隨沙箱生命週期結束而失效。
