# 入門

要使用 Deno Sandbox，你需要有 Deno Deploy 帳戶。若你還沒有帳戶，可以到
[console.deno.com](https://console.deno.com) 註冊免費帳戶。

## 進入 Deno Sandbox 儀表板

1. 前往 [console.deno.com](https://console.deno.com/) 並使用你的 Deploy 帳戶登入。
2. 選擇或建立你要執行 Deno Sandbox 的組織。
3. 開啟 **Sandboxes** 分頁，查看既有沙箱、生命週期使用量與存取權杖。

Deno Sandbox 與 Deno Deploy app 共用相同的組織邊界，因此可在兩個產品之間重複使用成員、
權杖與可觀測性設定。

## 建立組織權杖

`@deno/sandbox` SDK 使用 `DENO_DEPLOY_TOKEN` 環境變數進行驗證。請到
**Settings → Organization tokens** 產生權杖、複製其值，並妥善保存。接著在本機 shell
或 CI 工作中匯出：

```
export DENO_DEPLOY_TOKEN=<your-token>
```

![Deno Deploy 組織權杖畫面。](../assets/sandbox/images/org-tokens.webp)

權杖安全性

請將此權杖視同任何正式環境機密。若曾外洩，請立即在儀表板中輪替。

## 安裝 SDK

此 SDK 可在 Deno 與 Node.js 環境中使用。

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

此 SDK 可在 Python `>=3.10` 版本中使用。

```
# Install with uv
uv add deno-sandbox

# or with pip
pip install deno-sandbox
```

## 建立你的第一個沙箱

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

## 執行沙箱程式碼

這段程式碼需要網路存取權，才能連到建立沙箱所需的 Deploy edge，也需要存取環境變數以向
Deploy API 驗證，因此我們會在 `deno run` 指令傳入 `--allow-net` 與 `--allow-env`
旗標（或使用縮寫 `-EN`）。

```
deno -EN main.ts
```

若要執行剛剛建立的腳本，請執行：

```
uv run main.py
```

你建立的任何沙箱都會列在 Deno Deploy 組織的 **Sandboxes** 分頁中。

![在 Deno Deploy 主控台中建立的沙箱清單。](../assets/sandbox/images/sandbox-list.webp)

沙箱的詳細資訊會顯示在其 **事件日誌** 中。

![Deno Deploy 主控台中的沙箱事件日誌詳細資料。](../assets/sandbox/images/sandbox-event-log.webp)

## 設定沙箱

使用 `Sandbox.create()` 建立沙箱時，可以透過下列選項進行設定：

- `allowNet``allow_net`：
  可選的允許對外連線主機清單。參見
  [Outbound network control](security.md#outbound-network-control)。
- `secrets`：對外請求的機密替換規則。參見
  [Secret redaction and substitution](security.md#secret-redaction-and-substitution)。
- `region`：建立沙箱的 Deploy 區域。
- `memoryMb``memory_mb`：
  配置給沙箱的記憶體容量。
- `timeout`：沙箱逾時時間。
- `labels`：任意 key/value 標籤，協助識別與管理沙箱

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

## 執行命令與腳本

Deno Sandbox 提供熟悉的檔案系統與行程 API，可執行命令、上傳檔案，以及啟動長時間運作的服務。

例如，你可以列出根目錄中的檔案：

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

或是從本機檔案系統上傳腳本並執行：

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

你可以在命令之間保留狀態、串流 stdout 與 stderr，或開啟互動式 REPL 以支援 agent 式工作流程。

## 從 Deno Sandbox 部署

以下程式碼片段示範端到端工作流程：建立一個 Deploy app、啟動高記憶體沙箱來執行較重的建置、
在該 VM 內建立並建置 Next.js 專案，接著呼叫 `sandbox.deno.deploy()` 推送編譯後產物，
同時將建置日誌串流回你的終端機。

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

## 調整逾時、清理與重新連線

- `timeout: "session"`（預設）會在腳本執行完成後銷毀 VM。
- 提供像 `"5m"` 這樣的時間長度，可讓沙箱在用戶端斷線後仍持續存活。之後可用
  `Sandbox.connect({ id })` 繼續工作。
- 當程式碼釋放最後一個參照（或 `await using` 區塊結束）時會自動清理。只有在你需要提前拆除
  VM 時才呼叫 `sandbox.kill()`。

Deno Sandbox 與 Deno Deploy 共用可觀測性：每個沙箱的日誌、追蹤與指標都會出現在 Deno Deploy
儀表板中，因此你可以用和正式環境 app 相同的方式偵錯 agent 執行流程。
