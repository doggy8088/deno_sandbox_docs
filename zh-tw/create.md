# 創建 Deno Sandbox

沙箱創建方法是配置沙箱的主要入口點
Deploy 邊緣上的隔離 Linux microVM。它會傳回一個連接的沙箱
可用於執行指令、上傳檔案、公開 HTTP 端點的實例，
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

預設情況下，這會在最近的Deploy區域中建立一個臨時沙箱
1280 MB RAM，無出站網路存取，並且超時綁定到當前
過程。您可以透過傳遞選項物件來定製沙箱。

## 可用選項

|選項 |說明 |
| --- | --- |
| `region` |例如 `ams` 或 `ord` |
| `allowNet``allow_net` |允許的出站主機的選用清單。請參閱[出站網路控制](security.md#outbound-network-control)。 |
| `secrets` |用於替代對批准的主機的出站請求的秘密。請參閱[秘密編輯和替換](security.md#secret-redaction-and-substitution)。 |
| `memoryMb``memory_mb` |為記憶體密集型任務或預算緊張的任務分配 768 到 4096 MB 的 RAM。 |
| `timeout` | [沙箱存活多久](timeouts.md) 以 (m) 或 (s) 表示，例如 `5m` |
| `labels` |附加任意鍵/值標籤以協助識別和管理沙箱 |
| `env` |用於啟動沙箱的環境變數。 |

## 配置範例

### 允許特定 API 的出站流量

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

### 為核准的主機配置秘密替換

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

### 在具有更多記憶體的特定區域中運行

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

### 保持沙箱處於活動狀態以供以後檢查

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

## 尖端

- 盡可能保持網路白名單狹窄，以阻止滲透嘗試。
- 使用 `agentId` 或 `customerId` 等元資料鍵來追蹤沙箱
  Deploy 主控台。
- 讓上下文管理器 (Python) 或自動處置 (JavaScript) 處理
  清理。僅當您需要在之前終止它時才呼叫 `sandbox.kill()`
  那個自動清理。
- 對於長期服務，一旦
  代碼穩定。
