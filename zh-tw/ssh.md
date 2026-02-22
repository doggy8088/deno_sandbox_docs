# SSH

Deno Sandbox 可以提供 SSH 憑證，讓您檢查檔案系統、追蹤日誌、執行編輯器或轉送連接埠。SSH 存取同時支援終端機指令與 Deno Deploy Sandbox UI。

```
import { Sandbox } from "@deno/sandbox";

await using sandbox = await Sandbox.create();

const { hostname, username } = await sandbox.exposeSsh();
console.log(`ssh ${username}@${hostname}`);

// keep process alive or interact via SSH until done...
await new Promise((resolve) => setTimeout(resolve, 10 * 60 * 1000));
```

```
import time
from deno_sandbox import DenoDeploy

sdk = DenoDeploy()

with sdk.sandbox.create() as sandbox:
  ssh = sandbox.expose_ssh()
  print(f"ssh {ssh['username']}@{ssh['hostname']}")

  # keep process alive or interact via SSH until done...
  time.sleep(10 * 60)
```

```
import asyncio
from deno_sandbox import AsyncDenoDeploy

sdk = AsyncDenoDeploy()

async with sdk.sandbox.create() as sandbox:
  ssh = await sandbox.expose_ssh()
  print(f"ssh {ssh['username']}@{ssh['hostname']}")

  # keep process alive or interact via SSH until done...
  await asyncio.sleep(10 * 60)
```

沙箱會持續可連線，直到設定的逾時時間到期。當您的腳本釋放對它的參照（例如 `await using` 區塊結束）後，沙箱會關閉，SSH 端點也會消失；若需要立即拆除，也可以呼叫 `sandbox.kill()`。

## 從您的機器連線

### exposeSsh 方法

1. 透過 `sandbox.exposeSsh()` 取得憑證。
2. 使用提供的使用者名稱與主機名稱連線：

```
ssh ${username}@${hostname}
```

3. 使用一般終端機工作流程：複製檔案、執行 `top`、追蹤日誌，或附加到正在運行的程序。

## 在終端機中

執行腳本時，您可以使用 `--ssh` 旗標，直接從終端機透過 SSH 連入沙箱：

```
deno sandbox create -ssh
```

## 在 Deno Deploy 主控台中

建立沙箱後，您可以在 Deno Deploy 網頁應用程式中透過 SSH 連入沙箱。

1. 登入 [console.deno.com](https://console.deno.com/) 並前往 **Sandboxes** 區段。
2. 建立新的沙箱，或從清單中選取既有沙箱。
3. 點選 **Start SSH terminal**，在瀏覽器中開啟互動式終端機工作階段。

## 何時使用 SSH 存取

- 偵錯只在沙箱中失敗的代理產生程式碼
- 使用全螢幕終端機編輯器或遠端 VS Code 編輯檔案
- 不需在應用程式程式碼中加入額外偵測，即可即時串流日誌
- 執行以手動操作較方便的分析或檢查工具

由於每個沙箱本身就已隔離，開啟 SSH 不會危及其他專案或組織。

## 安全考量

- 憑證為單次使用，並與沙箱生命週期綁定。
- 您可以控制沙箱運行時間；銷毀沙箱即可立即撤銷存取權限。

## 讓沙箱保持運行

如果沙箱關閉，SSH 通道也會中斷。可透過以下方式保持沙箱運行：

- 設定 `timeout: "session"`（預設），並讓管理沙箱的腳本持續運行
- 建立沙箱時傳入 `timeout: "5m"`（或其他時間長度），讓它在腳本結束後仍保留，之後再透過 `Sandbox.connect({ id })` 重新連線

當您的程式碼不再持有沙箱參照時，系統會自動清理；若您想主動結束，也可以執行 `sandbox.kill()`（或直接在 SSH 工作階段中輸入 `exit`）。

## 工作流程範例

```
import { Sandbox } from "@deno/sandbox";

await using sandbox = await Sandbox.create({ timeout: "10m" });

// Prepare the app
await sandbox.fs.upload("./app", ".");
await sandbox.sh`deno task dev`
  .noThrow(); // start server; leave running for inspection

// Get SSH details
const ssh = await sandbox.exposeSsh();
console.log(`Connect with: ssh ${ssh.username}@${ssh.hostname}`);

// Block until you're done debugging manually
await new Promise((resolve) => setTimeout(resolve, 10 * 60 * 1000));
```

```
import time
from deno_sandbox import DenoDeploy

sdk = DenoDeploy()

with sdk.sandbox.create(timeout="10m") as sandbox:
  # Prepare the app
  sandbox.fs.upload("./app", ".")
  proc = sandbox.spawn("deno", args=["task", "dev"])
  # start server; leave running for inspection

  # Get SSH details
  ssh = sandbox.expose_ssh()
  print(f"Connect with: ssh {ssh['username']}@{ssh['hostname']}")

  # Block until you're done debugging manually
  time.sleep(10 * 60)
```

```
import asyncio
from deno_sandbox import AsyncDenoDeploy

sdk = AsyncDenoDeploy()

async with sdk.sandbox.create(timeout="10m") as sandbox:
  # Prepare the app
  await sandbox.fs.upload("./app", ".")
  proc = await sandbox.spawn("deno", args=["task", "dev"])
  # start server; leave running for inspection

  # Get SSH details
  ssh = await sandbox.expose_ssh()
  print(f"Connect with: ssh {ssh['username']}@{ssh['hostname']}")

  # Block until you're done debugging manually
  await asyncio.sleep(10 * 60)
```

使用這個模式可以調查不穩定（flaky）的建置、執行互動式 REPL，或與隊友協作除錯，而不必先把程式碼部署成完整的 Deploy 應用程式。
