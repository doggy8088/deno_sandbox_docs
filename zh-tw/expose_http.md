# 公開 HTTP

您可以在以下裝置上執行開發伺服器、預覽應用程式、Webhook 接收器或框架 CLI
任何連接埠並立即將它們發佈到安全性、隨機的 HTTPS URL。

建立沙箱時傳遞連接埠：

```
import { Sandbox } from "@deno/sandbox";

await using sandbox = await Sandbox.create({ port: 8000 });
console.log(sandbox.id);

await sandbox.fs.writeTextFile(
  "main.ts",
  "export default { fetch: () => new Response('hello from a sandbox!') }",
);

const p = await sandbox.sh`deno serve --watch main.ts`.spawn();

console.log("deno now listening on", sandbox.url);

await p.output();
```

```
from deno_sandbox import DenoDeploy

sdk = DenoDeploy()

with sdk.sandbox.create(port=8000) as sandbox:
  print(sandbox.id)

  sandbox.fs.write_text_file(
    "main.ts",
    "export default { fetch: () => new Response('hello from a sandbox!') }"
  )

  p = sandbox.spawn("deno", args=["serve", "--watch", "main.ts"])

  print(f"deno now listening on {sandbox.url}")

  p.wait()
```

```
from deno_sandbox import AsyncDenoDeploy

sdk = AsyncDenoDeploy()

async with sdk.sandbox.create(port=8000) as sandbox:
  print(sandbox.id)

  await sandbox.fs.write_text_file(
    "main.ts",
    "export default { fetch: () => new Response('hello from a sandbox!') }"
  )

  p = await sandbox.spawn("deno", args=["serve", "--watch", "main.ts"])

  print(f"deno now listening on {sandbox.url}")

  await p.wait()
```

然後可以透過設定DeployToken並執行以下命令來運行：

```
deno run -A --watch main.ts
```

設定 `--watch` 旗標可讓沙箱在程式碼執行時自動重新啟動
檢測更改，以獲得低保真熱重載體驗。

該 URL 在沙箱生命週期內保持有效，非常適合短期生存
QA 連結或代理程式產生的預覽。

## 何時公開 HTTP

每當您需要與隊友、機器人或其他人共享沙箱時，請公開 HTTP
外部服務：

- AI 產生的 Web 應用程式或即時演示的預覽鏈接
- 必須可從 Stripe、GitHub 等存取的 Webhook 接收器。
- 框架開發伺服器（`next dev`、`astro dev`、`deno task dev`）應該
  從瀏覽器檢查
- 臨時 API、運行狀況檢查或可觀測性探針

由於沙箱是短暫的，因此您無需管理 DNS 或憑證。
每次呼叫 `exposeHttp()` 都會在 `*.sandbox.deno.net` 下傳回一個唯一的主機名
自動配置 TLS。

對沙箱 URL 的所有請求都會將 HTTP 流量傳送到沙箱。

## 暴露Http()的用法

沙箱也支援按需公開 HTTP：

```
const previewUrl = await sandbox.exposeHttp({ port: 8000 });
console.log(`Preview ready at ${previewUrl}`);
```

```
preview_url = sandbox.expose_http(port=8000)
print(f"Preview ready at {preview_url}")
```

```
preview_url = await sandbox.expose_http(port=8000)
print(f"Preview ready at {preview_url}")
```

當您想要啟動一個不暴露 HTTP 的沙箱時，這非常有用，然後
稍後公開它（例如，在一些初始化或建置步驟之後）。

安全

當您呼叫此 API 時，目標 HTTP 服務將被公開公開，而無需
驗證。任何了解公共領域的人都可以發送
向公開服務發出請求。

## 觀察交通

透過公開的 URL 路由的請求會與您的Deploy日誌一起顯示，並且
痕跡。使用主控台可以：

- 依沙箱 ID 或時間範圍過濾日誌
- 檢查請求追蹤以追蹤邊緣和虛擬機器之間的延遲
- 如果預覽出現問題，請取消或重新啟動沙箱

## 安全和網路

- 暴露的 URL 是長的、隨機的子網域，很難猜測。
- TLS 終止發生在 Deploy 邊緣；流量是端對端加密的。

## 清理和限制

- 當沙箱生命週期結束時，公開的 URL 將停止接受流量。你可以
  呼叫 `sandbox.kill()` 提前終止沙箱（和 URL），如果
  需要。
- 對於持久性服務，請將程式碼分級到Deploy 應用程式中，而不是
  依賴長期運作的沙箱。

## 帶有框架的完整範例

```
import { Sandbox } from "@deno/sandbox";

await using sandbox = await Sandbox.create();

// Install dependencies
await sandbox.fs.writeTextFile(
  "package.json",
  JSON.stringify(
    {
      private: true,
      scripts: { dev: "next dev" },
      dependencies: {
        next: "^15.0.0",
        react: "^19.0.0",
        "react-dom": "^19.0.0",
      },
    },
    null,
    2,
  ),
);
await sandbox.fs.mkdir("pages", { recursive: true });
await sandbox.fs.writeTextFile(
  "pages/index.js",
  `export default function Home() {
  return (
    <main style={{ fontFamily: "system-ui", padding: "2rem" }}>
      <h1>Next.js sandbox</h1>
      <p>Edit pages/index.js to get started.</p>
    </main>
  );
}
`,
);
await sandbox.sh`npm install`;

// Start the dev server
const server = await sandbox.spawn("npm", {
  args: ["run", "dev"],
  stdout: "inherit",
  stderr: "inherit",
});

// Publish it
const previewUrl = await sandbox.exposeHttp({ port: 3000 });
console.log(`Preview ready at ${previewUrl}`);

await server.status; // keep running until the process exits
```

```
import json
from deno_sandbox import DenoDeploy

sdk = DenoDeploy()

with sdk.sandbox.create() as sandbox:
  # Install dependencies
  sandbox.fs.write_text_file(
    "package.json",
    json.dumps({
      "private": True,
      "scripts": {"dev": "next dev"},
      "dependencies": {
        "next": "^15.0.0",
        "react": "^19.0.0",
        "react-dom": "^19.0.0",
      },
    }, indent=2)
  )
  sandbox.fs.mkdir("pages", recursive=True)
  sandbox.fs.write_text_file(
    "pages/index.js",
    """export default function Home() {
  return (
    <main style={{ fontFamily: "system-ui", padding: "2rem" }}>
      <h1>Next.js sandbox</h1>
      <p>Edit pages/index.js to get started.</p>
    </main>
  );
}
"""
  )
  sandbox.spawn("npm", args=["install"]).wait()

  # Start the dev server
  server = sandbox.spawn("npm", args=["run", "dev"], stdout="inherit", stderr="inherit")

  # Publish it
  preview_url = sandbox.expose_http(port=3000)
  print(f"Preview ready at {preview_url}")

  server.wait()  # keep running until the process exits
```

```
import json
from deno_sandbox import AsyncDenoDeploy

sdk = AsyncDenoDeploy()

async with sdk.sandbox.create() as sandbox:
  # Install dependencies
  await sandbox.fs.write_text_file(
    "package.json",
    json.dumps({
      "private": True,
      "scripts": {"dev": "next dev"},
      "dependencies": {
        "next": "^15.0.0",
        "react": "^19.0.0",
        "react-dom": "^19.0.0",
      },
    }, indent=2)
  )
  await sandbox.fs.mkdir("pages", recursive=True)
  await sandbox.fs.write_text_file(
    "pages/index.js",
    """export default function Home() {
  return (
    <main style={{ fontFamily: "system-ui", padding: "2rem" }}>
      <h1>Next.js sandbox</h1>
      <p>Edit pages/index.js to get started.</p>
    </main>
  );
}
"""
  )
  proc = await sandbox.spawn("npm", args=["install"])
  await proc.wait()

  # Start the dev server
  server = await sandbox.spawn("npm", args=["run", "dev"], stdout="inherit", stderr="inherit")

  # Publish it
  preview_url = await sandbox.expose_http(port=3000)
  print(f"Preview ready at {preview_url}")

  await server.wait()  # keep running until the process exits
```

以這種方式使用 Deno Sandbox 可以讓您啟動功能齊全的框架
程式碼最少的開發伺服器，對於需要的代理程式或開發人員很有用
啟動高保真預覽，分享它們以獲取反饋，然後撕掉所有內容
打倒一個 `Ctrl+C`。
