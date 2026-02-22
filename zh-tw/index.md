# Deno Sandbox

Deno Sandbox 將即時 Linux microVM 引進 Deno Deploy。每個沙箱啟動
不到一秒，是由 `@deno/sandbox` SDK 驅動的 API，並拆解為
一旦你完成了。結果是按需計算，感覺就像打開一個
終端，但具有生產級隔離和可觀察性。

## 什麼是 Deno Sandbox？

- 由 Deno Deploy 編排的單一 Linux microVM
- 專為運行不受信任的程式碼而設計
- 即時可用；啟動時間以毫秒為單位
- 預設是短暫的，但能夠在當前連線之外持續存在
  壽命
- 能夠透過 [卷](volumes.md) 存取持久存儲
- 完全 API 驅動：建立、執行命令以及從程式碼中拆除

## 理想的用例

Deno Sandbox 專門針對需要產生程式碼的工作負載，
代表不受信任的使用者進行評估或安全執行。他們是理想的
為了：

- 人工智慧代理和副駕駛需要在推理時運行程式碼
- 安全插件或擴充系統
- Vibe 編碼與協作 IDE 體驗
- 臨時 CI 運行程序和冒煙測試
- 客戶提供或使用者產生的程式碼路徑
- 即時開發伺服器與預覽環境

這不僅是為開發人員構建的計算，也是為構建的軟體構建的
軟體.

## 運行真實的工作負載

一旦 Deno Sandbox 存在，您將獲得一個包含檔案的完整 Linux 環境，
進程、套件管理器和後台服務：

```
import { Sandbox } from "@deno/sandbox";
await using sandbox = await Sandbox.create();
await sandbox.sh`ls -lh /`;
```

```
from deno_sandbox import DenoDeploy

def main():
  sdk = DenoDeploy()

  with sdk.sandbox.create() as sandbox:
    process = sandbox.spawn("ls", args=["-lh"])
    process.wait()
```

```
from deno_sandbox import AsyncDenoDeploy

async def main():
  sdk = AsyncDenoDeploy()

  async with sdk.sandbox.create() as sandbox:
    process = await sandbox.spawn("ls", args=["-lh"])
    await process.wait()
```

## 安全政策

配置沙箱，使其只能與核准的主機通訊：

```
await Sandbox.create({
  allowNet: ["google.com"],
});
```

```
sdk = AsyncDenoDeploy()

async with sdk.sandboxes.create(allowNet=["google.com"]) as sandbox:
  print(f"Sandbox {sandbox.id} is ready.")
```

```
sdk = DenoDeploy()

with sdk.sandboxes.create(allowNet=["google.com"]) as sandbox:
  print(f"Sandbox {sandbox.id} is ready.")
```

秘密永遠不會進入沙箱環境。僅替換實際值
當沙箱向核准的主機發出出站請求時。

```
await Sandbox.create({
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
sdk = AsyncDenoDeploy()

async with sdk.sandboxes.create(
  allowNet=["api.openai.com"],
  secrets={
    "OPENAI_API_KEY": {
      "hosts": ["api.openai.com"],
      "value": os.environ.get("OPENAI_API_KEY"),
    }
  },
) as sandbox:
  print(f"Sandbox {sandbox.id} is ready.")
```

```
sdk = DenoDeploy()

with sdk.sandboxes.create(
  allowNet=["api.openai.com"],
  secrets={
    "OPENAI_API_KEY": {
      "hosts": ["api.openai.com"],
      "value": os.environ.get("OPENAI_API_KEY"),
    }
  },
) as sandbox:
  print(f"Sandbox {sandbox.id} is ready.")
```

## 專為即時、安全計算而構建

開發人員和人工智慧系統現在期望計算是即時的、安全的、全球性的
可以存取。 Deno Sandbox提供：

- 即時啟動，無需管理溫池
- 具有嚴格網路出口策略的專用隔離
- 完整的可觀察性以及 Deno Deploy 日誌和跟踪
- 每個沙箱的區域選擇、記憶體大小和生命週期控制
- 當程式碼準備好投入生產時，無縫移交給 Deno Deploy 應用程式

Deno Deploy 和 Deno Sandbox 一起形成一個工作流程：建立程式碼，
在沙箱中被證明是安全的，並且無需新的基礎設施或即可在全球Deploy
編排層。

## 運行時支援

Deno Sandbox SDK 在以下平台上進行了測試並受支援：

- **Deno：** 最新穩定版本
- **Node.js：** 版本 24+
- **Python：** >=3.10

您可以在任何可以進行出站 HTTPS 的環境中使用 Deno Sandbox
向 Deno Deploy API 發出請求。 JavaScript SDK 的提供方式為
`@deno/sandbox` 在 [JSR](https://jsr.io/@deno/sandbox) 和
[npm](https://www.npmjs.com/package/@deno/sandbox)（JSR 套件已最佳化
供 Deno 使用）。 Python SDK 以 `deno-sandbox` 形式提供
[PyPI](https://pypi.org/project/deno-sandbox/)。對於直接 API 存取，請參閱
[REST API 文件](https://console.deno.com/api/v2/docs)。

await using 支援

這
[`await using`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/await_using)
語法需要 Node.js 24+。如果您的專案使用早期的 Node.js 版本，請使用
try/finally 區塊代替：

```
import { Sandbox } from "@deno/sandbox";

const sandbox = await Sandbox.create();
try {
  // ... use sandbox ...
} finally {
  await sandbox.close();
}
```

## 限制

Deno Sandbox有以下限制：

- **記憶體：** 每個沙箱可配置 768 MB 至 4096 MB（預設為 1.2GB）
- **CPU：** 2 個 vCPU
- **生命週期：** 每個沙箱可配置並綁定到一個會話，最多 30 個
  分鐘
- **磁碟**：10 GB 暫存
- **並發**：每個組織 5 個並發沙箱（這是預設值
  Deno Sandbox 預發布階段的並發限制。接觸
  [Deploy@deno.com](mailto:deploy@deno.com) 請求更高的限制。 ）

超過這些限制可能會導致沙箱受到限製或終止。

## 地區

目前支援的地區有：

- `ams` - 荷蘭阿姆斯特丹
- `ord` - 芝加哥，美國

建立新沙箱時可以指定建立沙箱的區域
沙箱：

```
import { Sandbox } from "@deno/sandbox";

await using sandbox = await Sandbox.create({ region: "ams" });
```

```
from deno_sandbox import DenoDeploy

def main():
  sdk = DenoDeploy()

  with sdk.sandboxes.create(region="ams") as sandbox:
    print(f"Sandbox {sandbox.id} is ready.")
```

```
from deno_sandbox import AsyncDenoDeploy

async def main():
  sdk = AsyncDenoDeploy()

  async with sdk.sandboxes.create(region="ams") as sandbox:
    print(f"Sandbox {sandbox.id} is ready.")
```

如果未指定，沙箱將在預設區域中建立。

## 了解更多

準備好嘗試了嗎？依照 [入門](getting_started.md) 指南創建
您的第一個沙箱，取得存取Token，並在Deploy 邊緣上執行程式碼。
