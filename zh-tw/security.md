# 安全

Deno Sandbox 專為不受信任或人工智慧產生的工作負載而設計。每個虛擬機器都是
短暫的，在虛擬機器管理程序層級隔離，並受嚴格的出站管理
政策。這使您可以運行任意程式碼，同時保留組織資料和
基礎設施安全。

## 秘密編輯和替換

秘密永遠不會進入沙箱環境變數。相反，Deno Deploy
僅當沙箱向經批准的出站請求時才替換它們
主持人。建立沙箱時配置secret：

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

在沙箱內部，環境變數包含一個佔位符：

```
echo $ANTHROPIC_API_KEY
# <placeholder>
```

這證實了用戶代碼無法讀取真正的秘密。這個阻塞最多
常見的AI攻擊路徑是先註入再秘密滲漏
允許您的自動化安全地呼叫第三方 API。

## 出站網路控制

預設情況下，Deno Sandbox 具有不受限制的出站網路存取權。使用
用於限制特定主機流量的網路白名單選項：

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

|圖案|比賽|
| --- | --- |
| `example.com` |精確的主機名稱、任意連接埠 |
| `example.com:443` |僅在連接埠 443 上的精確主機名稱 |
| `*.example.com` | [example.com](http://example.com) | 的任何子域
| `192.0.2.1` |精確的 IPv4 位址 |
| `[2001:db8::1]` |精確的 IPv6 位址 |

任何對不在允許清單中的主機的出站請求將被阻止
提供了 `allowNet`。當省略 `allowNet` 時，所有出站請求
允許。將此與
[`secrets` 選項](#secret-redaction-and-substitution) 確保即使
如果程式碼被欺騙呼叫意外端點，則憑證永遠不會
發送。

## 文件系統隔離和清理

- MicroVM 從乾淨的磁碟映像啟動。您上傳的任何文件僅存在於
  除非您明確掛載卷，否則沙箱的生命週期。
- 一旦對沙箱的最後一個引用被刪除（或 `sandbox.kill()` 被刪除）
  呼叫），虛擬機器被銷毀並擦除磁碟，防止延遲狀態。
- 卷提供共享存儲，但每個沙箱的存取都是明確的，並且可以
  需要時以唯讀方式安裝。

## 審計和可觀察性

- 每個命令、HTTP 請求和 SSH 會話都可以在 Deno Deploy 中追蹤
  主控台，為您提供座席行為的書面記錄。
- 建立沙箱時附加元資料（例如 `metadata: { owner: "agent" }`）
  因此日誌和痕跡可以清楚地顯示誰發起了活動。
