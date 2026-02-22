# 公開 HTTP

您可以在任何連接埠上執行開發伺服器、預覽應用程式、Webhook 接收器或框架 CLI，並立即將它們發佈到安全、隨機的 HTTPS URL。

建立沙箱時可傳入連接埠：

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

接著設定 Deploy token 並執行：

```
deno run -A --watch main.ts
```

設定 `--watch` 旗標後，沙箱會在偵測到程式碼變更時自動重新啟動，提供簡易的熱重載體驗。

該 URL 在沙箱存活期間都會維持可用，非常適合短期 QA 連結或代理程式產生的預覽。

## 何時公開 HTTP

當您需要將沙箱分享給隊友、機器人或外部服務時，就該公開 HTTP：

- AI 產生的 Web 應用程式或即時示範的預覽連結
- 必須可由 Stripe、GitHub 等服務連入的 Webhook 接收器
- 需要透過瀏覽器檢視的框架開發伺服器（`next dev`、`astro dev`、`deno task dev`）
- 暫時性的 API、健康檢查或可觀測性探測

由於沙箱是暫時性的，您不需要管理 DNS 或憑證。每次呼叫 `exposeHttp()` 都會在 `*.sandbox.deno.net` 下取得一個唯一主機名稱，並自動完成 TLS 設定。

送往沙箱 URL 的所有請求，都會將 HTTP 流量轉送到該沙箱。

## `exposeHttp()` 用法

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

當您想先啟動一個不公開 HTTP 的沙箱，之後再公開（例如先完成初始化或建置步驟）時，這種做法就很實用。

安全性

呼叫此 API 時，目標 HTTP 服務會在沒有驗證機制的情況下對外公開。任何知道該公開網域的人都可以對該服務送出請求。

## 觀察交通

經由公開 URL 路由的請求，會與您的 Deploy 日誌與追蹤資料一起顯示。您可以在儀表板中：

- 依沙箱 ID 或時間範圍過濾日誌
- 檢查請求追蹤以追蹤邊緣和虛擬機器之間的延遲
- 如果預覽出現問題，請取消或重新啟動沙箱

## 安全性與網路

- 公開的 URL 會使用長且隨機的子網域，不易被猜中。
- TLS 終止於 Deploy 邊緣節點；流量為端對端加密。

## 清理與限制

- 沙箱生命週期結束後，公開的 URL 就會停止接收流量。如有需要，您也可以呼叫 `sandbox.kill()` 提前終止沙箱（及其 URL）。
- 若要提供長期服務，應將程式碼部署為 Deploy app，而不是依賴長時間運行的沙箱。

## 使用框架的完整範例

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

用這種方式使用 Deno Sandbox，可以用很少的程式碼啟動功能完整的框架開發伺服器。對於需要建立高擬真預覽、分享給他人回饋，並在按下 `Ctrl+C` 後一次清掉所有資源的代理程式或開發者來說，特別實用。
