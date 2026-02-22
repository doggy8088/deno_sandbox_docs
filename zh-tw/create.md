# 建立 Deno Sandbox

建立沙箱的方法，是在 Deploy edge 上佈建隔離 Linux microVM 的主要入口點。
它會回傳一個已連線的沙箱實例，你可以用它來執行命令、上傳檔案、公開 HTTP 端點，
或請求 SSH 存取。

```
import { Sandbox } from "@deno/sandbox";

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

預設情況下，這會在距離最近的 Deploy 區域建立一個短暫型（ephemeral）沙箱，
具備 1280 MB RAM、沒有對外網路存取權，且逾時設定會綁定到目前程序。你可以透過傳入選項物件
自訂沙箱。

## 可用選項

| Option | Description |
| --- | --- |
| `region` |例如 `ams` 或 `ord` |
| `allowNet``allow_net` |可選的允許對外連線主機清單。參見 [Outbound network control](security.md#outbound-network-control)。 |
| `secrets` |對核准主機的對外請求所使用的機密替換設定。參見 [Secret redaction and substitution](security.md#secret-redaction-and-substitution)。 |
| `memoryMb``memory_mb` |可配置 768 到 4096 MB RAM，適合記憶體密集工作或較緊的預算。 |
| `timeout` |[沙箱存活時間](timeouts.md)，以 (m) 或 (s) 表示，例如 `5m` |
| `labels` |附加任意 key/value 標籤，協助識別與管理沙箱 |
| `env` |啟動沙箱時預設提供的環境變數。 |

## 設定範例

### 允許對特定 API 的對外流量

```
const sandbox = await Sandbox.create({
  allowNet: ["api.openai.com", "api.stripe.com"],
});
```

```
sdk = DenoDeploy()

with sdk.sandbox.create(
  allow_net=["api.openai.com", "api.stripe.com"]
) as sandbox:
  print(f"Sandbox {sandbox.id} is ready.")
```

```
sdk = AsyncDenoDeploy()

async with sdk.sandbox.create(
  allow_net=["api.openai.com", "api.stripe.com"]
) as sandbox:
  print(f"Sandbox {sandbox.id} is ready.")
```

### 為核准主機設定機密替換

```
const sandbox = await Sandbox.create({
  allowNet: ["api.openai.com"],
  secrets: {
    OPENAI_API_KEY: {
      hosts: ["api.openai.com"],
      value: process.env.OPENAI_API_KEY,
    },
  },
});
```

```
import os
from deno_sandbox import DenoDeploy

sdk = DenoDeploy()

with sdk.sandbox.create(
  allow_net=["api.openai.com"],
  secrets={
    "OPENAI_API_KEY": {
      "hosts": ["api.openai.com"],
      "value": os.environ.get("OPENAI_API_KEY"),
    }
  }
) as sandbox:
  print(f"Sandbox {sandbox.id} is ready.")
```

```
import os
from deno_sandbox import AsyncDenoDeploy

sdk = AsyncDenoDeploy()

async with sdk.sandbox.create(
  allow_net=["api.openai.com"],
  secrets={
    "OPENAI_API_KEY": {
      "hosts": ["api.openai.com"],
      "value": os.environ.get("OPENAI_API_KEY"),
    }
  }
) as sandbox:
  print(f"Sandbox {sandbox.id} is ready.")
```

### 在特定區域執行並提高記憶體

```
const sandbox = await Sandbox.create({
  region: "ams",
  memoryMb: 2048,
});
```

```
sdk = DenoDeploy()

with sdk.sandbox.create(
  region="ams",
  memory_mb=2048
) as sandbox:
  print(f"Sandbox {sandbox.id} is ready.")
```

```
sdk = AsyncDenoDeploy()

async with sdk.sandbox.create(
  region="ams",
  memory_mb=2048
) as sandbox:
  print(f"Sandbox {sandbox.id} is ready.")
```

### 讓沙箱保持運作，以便稍後檢查

```
const sandbox = await Sandbox.create({ timeout: "10m" });
const id = sandbox.id;
await sandbox.close(); // disconnect but leave VM running

// ...later...
const reconnected = await Sandbox.connect({ id });
```

```
sdk = DenoDeploy()

with sdk.sandbox.create(timeout="10m") as sandbox:
  sandbox_id = sandbox.id
  sandbox.close()  # disconnect but leave VM running

# ...later...
with sdk.sandbox.connect(sandbox_id) as reconnected:
  print(f"Reconnected to {reconnected.id}")
```

```
sdk = AsyncDenoDeploy()

async with sdk.sandbox.create(timeout="10m") as sandbox:
  sandbox_id = sandbox.id
  await sandbox.close()  # disconnect but leave VM running

# ...later...
async with sdk.sandbox.connect(sandbox_id) as reconnected:
  print(f"Reconnected to {reconnected.id}")
```

### 提供預設環境變數

```
const sandbox = await Sandbox.create({
  env: {
    NODE_ENV: "development",
    FEATURE_FLAG: "agents",
  },
});
```

```
sdk = DenoDeploy()

with sdk.sandbox.create(
  env={
    "NODE_ENV": "development",
    "FEATURE_FLAG": "agents",
  }
) as sandbox:
  print(f"Sandbox {sandbox.id} is ready.")
```

```
sdk = AsyncDenoDeploy()

async with sdk.sandbox.create(
  env={
    "NODE_ENV": "development",
    "FEATURE_FLAG": "agents",
  }
) as sandbox:
  print(f"Sandbox {sandbox.id} is ready.")
```

## Tips

- 盡量縮小網路允許清單，降低資料外洩（exfiltration）嘗試的風險。
- 使用 `agentId` 或 `customerId` 等 metadata key，方便在 Deploy 儀表板追蹤沙箱。
- 讓 context manager（Python）或自動釋放機制（JavaScript）處理清理工作。只有在需要提前終止時才呼叫
  `sandbox.kill()`。
- 對於長時間運作的服務，當程式碼穩定後，應從 Deno Sandbox 遷移到 Deploy app。
