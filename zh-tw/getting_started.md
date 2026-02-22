# 入門

要使用 Deno Sandbox，您需要一個 Deno Deploy 帳戶。如果您還沒有
您可以在以下位置註冊一個免費帳戶：
[console.deno.com](https://console.deno.com)。

## 造訪 Deno Sandbox主控台

1. 造訪 [console.deno.com](https://console.deno.com/) 並使用您的帳戶登入
   Deploy 帳戶。
2. 選擇或建立您想要執行 Deno Sandbox 的組織。
3. 打開 **沙箱** 標籤以查看現有沙箱、生命週期使用情況和
   存取Token。

Deno Sandbox 和 Deno Deploy 應用程式共享相同的組織邊界，因此您
可以在兩個產品中重複使用成員、Token和可觀察性設定。

## 創建組織Token

`@deno/sandbox` SDK 使用 `DENO_DEPLOY_TOKEN` 環境進行身份驗證
變數。從 **設定 → 組織Token** 產生它，複製值，
並妥善保管。然後將其匯出到本地 shell 或 CI 作業中：

```
export DENO_DEPLOY_TOKEN=<your-token>
```

![Deno Deploy 組織Token畫面。](../assets/sandbox/images/org-tokens.webp)

Token安全

請將此 Token 視為正式環境機密，若有外洩風險請立即在主控台輪替
如果它被暴露了。

## 安裝SDK

該 SDK 可在 Deno 和 Node.js 環境中運作。

```
# Using Deno
deno add jsr:@deno/sandbox

# Using npm
npm install @deno/sandbox

# Using pnpm
pnpm install jsr:@deno/sandbox

# Using yarn
yarn add jsr:@deno/sandbox
```

此 SDK 可在 Python 版本 `>=3.10` 中運作。

```
# Install with uv
uv add deno-sandbox

# or with pip
pip install deno-sandbox
```

## 創建您的第一個沙箱

main.ts

```
import { Sandbox } from "@deno/sandbox";
await using sandbox = await Sandbox.create();
await sandbox.sh`ls -lh /`;
```

main.py

```
from deno_sandbox import DenoDeploy

def main():
  sdk = DenoDeploy()

  with sdk.sandbox.create() as sandbox:
    process = sandbox.spawn("ls", args=["-lh"])
    process.wait()

if __name__ == '__main__':
  main()
```

main.py

```
import asyncio
from deno_sandbox import DenoDeploy

async def main():
  sdk = DenoDeploy()

  async with sdk.sandbox.create() as sandbox:
    process = await sandbox.spawn("ls", args=["-lh"])
    await process.wait()

if __name__ == '__main__':
  asyncio.run(main())
```

## 運行您的沙箱程式碼

此程式碼將需要存取網路才能到達Deploy 邊緣
將建立沙箱，並存取環境變量
使用 Deploy API 進行身份驗證，因此我們將傳入 `--allow-net` 和
`--allow-env` 標記為 `deno run` 指令（或使用簡寫 `-EN`）。

```
deno -EN main.ts
```

若要執行我們剛剛建立的腳本，請執行：

```
uv run main.py
```

您建立的任何沙箱都將列在 Deno 的 **沙箱** 標籤中
Deploy 組織。

![在 Deno Deploy 主控台中建立的沙箱清單。](../assets/sandbox/images/sandbox-list.webp)

沙箱的詳細資訊會顯示在其 **事件日誌** 中。

![Deno Deploy 主控台中的沙箱事件日誌詳細資料。](../assets/sandbox/images/sandbox-event-log.webp)

## 配置您的沙箱

使用 `Sandbox.create()` 建立沙箱時，可以使用下列命令對其進行配置
以下選項：

- `allowNet``allow_net`：
  允許的出站主機的可選清單。看
  [出站網路控制](security.md#outbound-network-control)。
- `secrets`：出站請求的秘密替換規則。看
  [秘密編輯和替換](security.md#secret-redaction-and-substitution)。
- `region`：Deploy將在其中建立沙箱的區域。
- `memoryMb``memory_mb`：
  分配給沙箱的內存量。
- `timeout`：沙箱逾時。
- `labels`：任意鍵/值標籤，幫助識別和管理沙箱

```
await using sandbox = await Sandbox.create({
  allowNet: ["api.stripe.com", "api.openai.com"], // optional: list of hosts that this sandbox can communicate with
  region: "ams", // optional: choose the Deploy region
  memoryMb: 1024, // optional: pick the RAM size (768-4096)
});
```

```
from deno_sandbox import DenoDeploy

sdk = DenoDeploy()

with sdk.sandbox.create(
  allow_net=["api.stripe.com", "api.openai.com"],  # optional: list of hosts that this sandbox can communicate with
  region="ams",  # optional: choose the Deploy region
  memory_mb=1024,  # optional: pick the RAM size (768-4096)
) as sandbox:
  print(f"Sandbox {sandbox.id} is ready.")
```

```
from deno_sandbox import AsyncDenoDeploy

sdk = AsyncDenoDeploy()

async with sdk.sandbox.create(
  allow_net=["api.stripe.com", "api.openai.com"],  # optional: list of hosts that this sandbox can communicate with
  region="ams",  # optional: choose the Deploy region
  memory_mb=1024,  # optional: pick the RAM size (768-4096)
) as sandbox:
  print(f"Sandbox {sandbox.id} is ready.")
```

## 運行命令和腳本

Deno Sandbox 公開了熟悉的檔案系統和進程 API 來執行命令，
上傳文件並產生長時間運行的服務。

例如，您可以列出根目錄中的檔案：

```
await sandbox.sh`ls -lh /`;
```

```
process = sandbox.spawn("ls", args=["-lh", "/"])
process.wait()
```

```
process = await sandbox.spawn("ls", args=["-lh", "/"])
await process.wait()
```

或從本機檔案系統上傳腳本並運行它：

```
// Upload a file to a specific path in the sandbox
await sandbox.fs.upload("./local-hello.ts", "./hello.ts");
const proc = await sandbox.spawn("deno", {
  args: ["run", "hello.ts"],
  stdout: "piped",
});
for await (const chunk of proc.stdout) {
  console.log(new TextDecoder().decode(chunk));
}
await proc.status;
```

```
# Upload a file to a specific path in the sandbox
sandbox.fs.upload("./local-hello.py", "./hello.py")
proc = sandbox.spawn("python", args=["hello.py"], stdout="piped")
for chunk in proc.stdout:
  print(chunk.decode())
proc.wait()
```

```
# Upload a file to a specific path in the sandbox
await sandbox.fs.upload("./local-hello.py", "./hello.py")
proc = await sandbox.spawn("python", args=["hello.py"], stdout="piped")
async for chunk in proc.stdout:
  print(chunk.decode())
await proc.wait()
```

您可以保持命令之間的狀態、串流 stdout 和 stderr，或開啟一個
用於代理式工作流程的互動式 REPL。

## 從 Deno Sandbox 部署

下面的程式碼片段介紹了端到端的工作流程：它創建了一個 Deploy 應用程序，
啟動高內存沙箱以進行較重的構建、腳手架並構建 Next.js
該虛擬機器內的項目，然後呼叫 `sandbox.deno.deploy()` 來推送已編譯的
將建置日誌流回終端時的工件。

```
import { Client, Sandbox } from "@deno/sandbox";

const client = new Client();
const app = await client.apps.create();

await using sandbox = await Sandbox.create({ memoryMb: 4096 });
console.log("Created sandbox", sandbox);

await sandbox
  .sh`deno -A npm:create-next-app@latest --yes --skip-install my-app`;
await sandbox.sh`cd my-app && deno install`;
await sandbox.sh`cd my-app && deno task build`;
await sandbox.sh`cd my-app && du -sh .`;
const build = await sandbox.deno.deploy(app.slug, {
  path: "my-app",
  production: true,
  build: {
    entrypoint: "node_modules/.bin/next",
    args: ["start"],
  },
});

for await (const log of build.logs()) {
  console.log(log.message);
}
```

```
from deno_sandbox import DenoDeploy

sdk = DenoDeploy()

app = sdk.apps.create(slug="my-next-app")

with sdk.sandbox.create(memory_mb=4096) as sandbox:
  print(f"Created sandbox {sandbox.id}")

  sandbox.spawn("deno", args=["-A", "npm:create-next-app@latest", "--yes", "--skip-install", "my-app"]).wait()
  sandbox.spawn("sh", args=["-c", "cd my-app && deno install"]).wait()
  sandbox.spawn("sh", args=["-c", "cd my-app && deno task build"]).wait()

  build = sandbox.deno.deploy(
    app["slug"],
    path="my-app",
    production=True,
    entrypoint="node_modules/.bin/next",
    args=["start"],
  )

  for log in build.logs():
    print(log["message"])
```

```
from deno_sandbox import AsyncDenoDeploy

sdk = AsyncDenoDeploy()

app = await sdk.apps.create(slug="my-next-app")

async with sdk.sandbox.create(memory_mb=4096) as sandbox:
  print(f"Created sandbox {sandbox.id}")

  proc = await sandbox.spawn("deno", args=["-A", "npm:create-next-app@latest", "--yes", "--skip-install", "my-app"])
  await proc.wait()
  proc = await sandbox.spawn("sh", args=["-c", "cd my-app && deno install"])
  await proc.wait()
  proc = await sandbox.spawn("sh", args=["-c", "cd my-app && deno task build"])
  await proc.wait()

  build = await sandbox.deno.deploy(
    app["slug"],
    path="my-app",
    production=True,
    entrypoint="node_modules/.bin/next",
    args=["start"],
  )

  async for log in build.logs():
    print(log["message"])
```

## 調整逾時、清理和重新連接

- `timeout: "session"`（預設）會在腳本完成後銷毀虛擬機器。
- 提供諸如 `"5m"` 之類的持續時間，以確保沙箱即使在
  客戶端斷開連線。您可以稍後 `Sandbox.connect({ id })` 恢復工作。
- 當您的程式碼刪除最後一個引用（或
  `await using` 區塊結束）。僅當您需要撕毀時才致電 `sandbox.kill()`
  VM 提前關閉。

可觀察性與 Deno Deploy 共享：每個沙箱日誌、追蹤和指標
在 Deno Deploy 主控台中可見，因此您可以以相同的方式偵錯代理程式運行
您調試生產應用程式。
