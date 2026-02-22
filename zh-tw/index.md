# Deno Sandbox

Deno Sandbox 將即時啟動的 Linux microVM 帶到 Deno Deploy。每個沙箱都能在
不到一秒內開機，透過 `@deno/sandbox` SDK 以 API 方式操作，並在使用完成後
立即拆除。這讓你獲得隨需運算的體驗，像是打開終端機一樣直覺，同時具備正式環境
等級的隔離性與可觀測性。

## 什麼是 Deno Sandbox？

- 由 Deno Deploy 編排的獨立 Linux microVM
- 專為執行不受信任程式碼而設計
- 即時可用；開機時間以毫秒計
- 預設為短暫型（ephemeral），但也能在目前連線生命週期之外持續存在
- 可透過 [volumes](volumes.md) 存取持久化儲存
- 完全由 API 驅動：可從程式碼建立、執行命令與拆除

## 理想使用情境

Deno Sandbox 特別適合需要代表不受信任使用者產生、評估或安全執行程式碼的工作負載。
很適合用在：

- 需要在推理過程中執行程式碼的 AI 代理與 copilots
- 安全的外掛或擴充系統
- vibe coding 與協作式 IDE 體驗
- 臨時 CI runner 與 smoke test
- 客戶提供或使用者產生程式碼的執行路徑
- 即時開發伺服器與預覽環境

這不只是為開發者打造的運算資源，而是為「會打造軟體的軟體」而生的運算平台。

## 執行真實工作負載

建立 Deno Sandbox 後，你會獲得完整的 Linux 環境，具備檔案、行程、套件管理器與背景服務：

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

## 安全性政策

你可以建立只允許連線到核准主機的沙箱：

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

機密值不會直接進入沙箱環境。只有當沙箱向核准主機發出對外請求時，才會以實際值進行替換。

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

## 為即時且安全的運算而打造

開發者與 AI 系統現在期待運算資源具備即時性、安全性與全球可達性。Deno Sandbox 提供：

- 即時啟動，無需管理 warm pool
- 搭配嚴格網路出口政策的專屬隔離
- 與 Deno Deploy 日誌和追蹤整合的完整可觀測性
- 可為每個沙箱設定區域、記憶體大小與生命週期控制
- 程式碼準備好進入正式環境時，可無縫交接到 Deno Deploy 應用程式

Deno Deploy 與 Deno Sandbox 共同形成單一工作流程：程式碼先被建立、在沙箱中驗證安全性，
再不需新增基礎設施或編排層就能全球部署。

## 執行環境支援

Deno Sandbox SDK 已測試並支援以下環境：

- **Deno:** 最新穩定版本
- **Node.js:** 24+ 版
- **Python:** >=3.10

只要執行環境能對 Deno Deploy API 發出 HTTPS 對外請求，就能使用 Deno Sandbox。
JavaScript SDK 以 `@deno/sandbox` 套件提供於 [jsr](https://jsr.io/@deno/sandbox) 與
[npm](https://www.npmjs.com/package/@deno/sandbox)（JSR 套件針對 Deno 使用最佳化）。
Python SDK 以 `deno-sandbox` 套件提供於
[PyPI](https://pypi.org/project/deno-sandbox/)。如需直接存取 API，請參閱
[REST API documentation](https://console.deno.com/api/v2/docs)。

await using 支援

[`await using`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/await_using)
語法需要 Node.js 24+。如果你的專案使用較早版本的 Node.js，請改用 try/finally 區塊：

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

Deno Sandbox 有以下限制：

- **記憶體：** 每個沙箱可設定 768 MB 到 4096 MB（預設 1.2GB）
- **CPU：** 2 vCPU
- **生命週期：** 可為每個沙箱設定，並綁定至 session，最長 30 分鐘
- **磁碟：** 10 GB 暫時性儲存空間
- **併發數：** 每個組織可同時執行 5 個沙箱（這是 Deno Sandbox 預發布階段的預設併發限制。
  如需更高限制，請聯絡 [deploy@deno.com](mailto:deploy@deno.com)。）

超出上述限制可能導致沙箱被節流或終止。

## 區域

目前支援的區域如下：

- `ams` - 荷蘭阿姆斯特丹
- `ord` - 美國芝加哥

建立新沙箱時，可以指定要在哪個區域建立：

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

若未指定，沙箱會在預設區域建立。

## 了解更多

準備開始了嗎？請依照 [Getting started](getting_started.md) 指南建立你的第一個沙箱、
取得存取權杖，並在 Deploy edge 上執行程式碼。
