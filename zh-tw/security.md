# 安全性

Deno Sandbox 是為不受信任或 AI 產生的工作負載而設計。每個 VM 都是短暫（ephemeral）的、在 hypervisor 層級隔離，並受嚴格的對外連線政策控管。這讓您能執行任意程式碼，同時維持組織資料與基礎設施的安全。

## Secret 遮罩與替換

Secret 不會進入沙箱的環境變數。相反地，Deno Deploy 只會在沙箱對已核准主機發出對外請求時，才進行 secret 替換。您可以在建立沙箱時設定 secrets：

```
await using sandbox = await Sandbox.create({
  secrets: {
    OPENAI_API_KEY: {
      hosts: ["api.openai.com"],
      value: process.env.OPENAI_API_KEY,
    },
    ANTHROPIC_API_KEY: {
      hosts: ["api.anthropic.com"],
      value: process.env.ANTHROPIC_API_KEY,
    },
  },
});
```

```
import os
from deno_sandbox import DenoDeploy

sdk = DenoDeploy()

with sdk.sandbox.create(
  secrets={
    "OPENAI_API_KEY": {
      "hosts": ["api.openai.com"],
      "value": os.environ.get("OPENAI_API_KEY"),
    },
    "ANTHROPIC_API_KEY": {
      "hosts": ["api.anthropic.com"],
      "value": os.environ.get("ANTHROPIC_API_KEY"),
    },
  }
) as sandbox:
  print(f"Sandbox {sandbox.id} is ready.")
```

```
import os
from deno_sandbox import AsyncDenoDeploy

sdk = AsyncDenoDeploy()

async with sdk.sandbox.create(
  secrets={
    "OPENAI_API_KEY": {
      "hosts": ["api.openai.com"],
      "value": os.environ.get("OPENAI_API_KEY"),
    },
    "ANTHROPIC_API_KEY": {
      "hosts": ["api.anthropic.com"],
      "value": os.environ.get("ANTHROPIC_API_KEY"),
    },
  }
) as sandbox:
  print(f"Sandbox {sandbox.id} is ready.")
```

在沙箱內部，環境變數只會看到一個佔位符：

```
echo $ANTHROPIC_API_KEY
# <placeholder>
```

這表示使用者程式碼無法讀取真正的 secret。這可阻擋常見的 AI 攻擊路徑（prompt injection 後接 secret 外洩），同時仍允許您的自動化流程安全呼叫第三方 API。

## 出站網路控制

預設情況下，Deno Sandbox 的對外網路存取不受限制。您可使用網路允許清單（allowlist）選項，將流量限制在特定主機：

```
await using sandbox = await Sandbox.create({
  allowNet: ["api.openai.com", "*.anthropic.com"],
});
```

```
sdk = DenoDeploy()

with sdk.sandbox.create(
  allow_net=["api.openai.com", "*.anthropic.com"]
) as sandbox:
  print(f"Sandbox {sandbox.id} is ready.")
```

```
sdk = AsyncDenoDeploy()

async with sdk.sandbox.create(
  allow_net=["api.openai.com", "*.anthropic.com"]
) as sandbox:
  print(f"Sandbox {sandbox.id} is ready.")
```

支援的模式包括：

| Pattern | Matches |
| --- | --- |
| `example.com` | 精確主機名稱，任意連接埠 |
| `example.com:443` | 僅限連接埠 443 的精確主機名稱 |
| `*.example.com` | [example.com](http://example.com) 的任意子網域 |
| `192.0.2.1` | 精確 IPv4 位址 |
| `[2001:db8::1]` | 精確 IPv6 位址 |

當提供 `allowNet` 時，任何對不在允許清單中的主機所發出的對外請求都會被阻擋。若省略 `allowNet`，則允許所有對外請求。請搭配[`secrets` 選項](#secret-redaction-and-substitution)使用，以確保即使程式碼被誘導去呼叫非預期端點，也不會送出憑證。

## 檔案系統隔離與清理

- MicroVM 會從乾淨的磁碟映像開機。您上傳的任何檔案都只會在沙箱生命週期內存在，除非您明確掛載磁碟區。
- 當對某個沙箱的最後一個參照被釋放（或呼叫 `sandbox.kill()`）時，VM 會被銷毀且磁碟會被抹除，避免殘留狀態。
- 磁碟區提供共享儲存空間，但每個沙箱的存取都必須明確指定，且必要時可用唯讀方式掛載。

## 稽核與可觀測性

- 每個命令、HTTP 請求與 SSH 工作階段都可以在 Deno Deploy 儀表板中追蹤，提供 agent 行為的稽核紀錄。
- 建立沙箱時附加中繼資料（例如 `metadata: { owner: "agent" }`），讓日誌與追蹤資料清楚顯示活動由誰發起。
