# SSH

Deno Sandbox 可以分發 SSH 憑證，以便您可以檢查檔案系統，
尾日誌、執行編輯器或轉送連接埠。 SSH 存取在您的系統中均可使用
終端機作為命令並在 Deno Deploy Sandbox UI 中。

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

沙箱保持可存取，直到配置的超時到期。一旦你的
腳本釋放其引用（例如，`await using` 區塊結束）
沙箱關閉並且 SSH 端點消失；你也可以打電話
`sandbox.kill()` 如果您需要立即將其拆除。

## 從您的機器連接

### 暴露Ssh方法

1. 透過 `sandbox.exposeSsh()` 請求憑證。
2. 使用提供的使用者名稱和主機名稱進行連線：

```
ssh ${username}@${hostname}
```

3. 使用常規終端工作流程：複製檔案、運行頂部、尾部日誌或附加到
   正在運行的進程。

## 在航廈

您可以在下列情況下使用 `--ssh` 旗標從終端透過 SSH 連接到沙箱：
運行你的腳本：

```
deno sandbox create -ssh
```

## 在 Deno Deploy 主控台中

建立沙箱後，您可以在 Deno Deploy Web 應用程式中透過 SSH 進入沙箱。

1. 登入 [console.deno.com](https://console.deno.com/) 並導航至
   **沙箱**部分。
2. 建立一個新沙箱或從清單中選擇現有沙箱。
3. 按一下 **啟動 SSH 終端機** 在您的電腦中開啟互動式終端機會話
   瀏覽器。

## 何時使用 SSH 存取

- 偵錯代理程式產生的僅在沙箱中失敗的程式碼
- 使用全螢幕終端編輯器或遠端 VS Code 編輯文件
- 即時串流日誌，無需檢測應用程式程式碼
- 運行更易於手動使用的分析或檢查工具

由於每個沙箱已經隔離，因此打開 SSH 不會危及其他沙箱
項目或組織。

## 安全考慮

- 憑證是一次性的，並且與沙箱生命週期相關。
- 您可以控製沙箱運行的時間；銷毀它以立即撤銷存取權限。

## 保持沙箱的活力

如果沙箱關閉，SSH 隧道也會關閉。透過以下方式保持其運作：

- 設定 `timeout: "session"` （預設）並保持管理腳本處於活動狀態
- 建立沙箱時傳遞 `timeout: "5m"` （或其他持續時間），以便它
  腳本退出後仍然存在，然後重新連接
  `Sandbox.connect({ id })`

當您的程式碼停止引用沙箱時，清理是自動的，但您可以
如果你想的話，執行 `sandbox.kill()` （或在 SSH 會話中簡單地執行 `exit` ）
根據需要結束它。

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

使用此模式來研究片狀建置、運行互動式 REPL 或配對
與隊友一起工作，而無需將程式碼升級為完整的 Deploy 應用程式。
