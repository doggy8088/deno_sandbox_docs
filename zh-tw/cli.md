# 透過 CLI 管理

Deno CLI 內建了用於管理 Deno Sandbox 實例的指令，讓您可以直接在終端機中建立、控制與操作這些實例。

這項整合讓 Deno Sandbox 管理能自然地融入您既有的 Deno 工作流程。

## 建立您的第一個沙箱

開始使用最簡單的方式是執行 `deno sandbox create`。預設情況下，這會建立一個互動式、以 session 為基礎的沙箱，並在準備完成後自動開啟 SSH 連線：

```
deno sandbox create
```

如果您的系統無法使用 SSH，則會改為顯示連線資訊。當您離開該 session 時，沙箱會自行清理。

在開發工作中，您通常會想把專案檔案複製進沙箱。`--copy` 選項會將檔案上傳到沙箱內的 `/app` 目錄：

```
deno sandbox create --copy ./my-project
```

您也可以在建立時複製多個目錄：

```
deno sandbox create --copy ./src --copy ./config
```

如果您需要讓沙箱運行超過單一 session，可透過 `--timeout` 指定逾時時間：

```
deno sandbox create --timeout 2m
```

您也可以建立自訂記憶體限制的沙箱：

```
deno sandbox create --memory 2gib
```

若要為 Web 應用程式公開 HTTP 連接埠：

```
deno sandbox create --expose-http 3000
```

您可以使用 `--volume` 旗標將持久性磁碟區掛載到沙箱：

```
deno sandbox create --volume my-volume:/data
```

若要建立沙箱並立即執行命令：

```
deno sandbox create ls /
```

這對建置與測試專案特別實用。您可以在同一個指令中複製檔案並執行建置流程：

```
deno sandbox create --copy ./app --cwd /app "npm i && npm start"
```

對於 Web 應用程式，您可以公開連接埠來存取正在執行的服務：

```
deno sandbox create --expose-http 3000 --copy ./web-app --cwd /app "npm i && npm run dev"
```

較複雜的流程也可以用加上引號的命令串接來表示：

```
deno sandbox create --copy ./app --cwd /app "npm install && npm test && npm run build"
```

## 檢視您的 Deno Sandbox

使用 `deno sandbox list`（或 `deno sandbox ls`）查看您組織中的所有沙箱：

```
$ deno sandbox list
ID                             CREATED                  REGION   STATUS    UPTIME
sbx_ord_1at5nn58e77rtd11e3k3   2026-01-30 18:33:40.79   ord      running   26.9s
sbx_ord_fwnygdsnszfe5ghafyx8   2026-01-30 18:31:40.90   ord      stopped   5.1s
sbx_ord_4xqcyahb8ye2r5a643de   2026-01-30 18:29:59.10   ord      stopped   9.4s
```

這會顯示每個沙箱的 ID、建立時間、區域、狀態與運行時間。

## 遠端執行命令

`deno sandbox exec` 指令讓您可以在任何運行中的沙箱內執行單一命令，而不需要開啟互動式 session。這非常適合自動化、CI/CD 流程或快速的一次性工作：

```
deno sandbox exec sbx_ord_abc123def456 ls -la
```

大多數情況下，您會在 `/app` 目錄中工作（也就是複製檔案所在的位置）。使用 `--cwd` 設定工作目錄：

```
deno sandbox exec sbx_ord_abc123def456 --cwd /app npm install
```

若用於腳本或自動化，可使用 `--quiet` 抑制命令輸出：

```
deno sandbox exec sbx_ord_abc123def456 --quiet --cwd /app npm test
```

您也可以將整段命令加上引號來執行複雜的命令串接：

```
deno sandbox exec sbx_ord_abc123def456 --cwd /app "npm install && npm test"
```

`exec` 指令能自然地與 Unix pipe 與標準輸入/輸出搭配使用。您可以把沙箱命令輸出 pipe 到本機工具：

```
deno sandbox exec sbx_ord_abc123def456 'ls -lh /' | wc -l
```

也可以把本機資料 pipe 到沙箱程序中處理：

```
cat large-dataset.csv | deno sandbox exec sbx_ord_abc123def456 --cwd /app "deno run -A main.ts"
```

這讓沙箱處理流程能輕鬆整合到更大的 Unix 工作流程與資料管線中。

## 傳輸檔案

雖然您可以在建立 Deno Sandbox 時複製檔案，但之後可能仍需更新或取回檔案。`deno sandbox copy` 指令（也可寫成 `deno sandbox cp`）支援雙向傳輸：從本機到 Deno Sandbox、從 Deno Sandbox 回到本機，甚至在不同沙箱之間複製。

將檔案從本機複製到沙箱：

```
deno sandbox copy ./app.js sbx_ord_abc123def456:/app/
```

從沙箱取回檔案到本機：

```
deno sandbox copy sbx_ord_abc123def456:/app/results.json ./output/
```

在不同沙箱之間複製檔案：

```
deno sandbox copy sbx_ord_abc123def456:/app/data.csv sbx_ord_xyz789uvw012:/app/input/
```

您可以使用 glob 模式從 Deno Sandbox 複製多個檔案：

```
deno sandbox copy sbx_ord_abc123def456:/app/*.json ./config/
deno sandbox copy sbx_ord_abc123def456:/app/logs/*.log ./logs/
```

您也可以一次複製多個檔案與目錄：

```
deno sandbox copy ./src/ ./package.json sbx_ord_abc123def456:/app/
```

您也可以自訂目標路徑，以便整理沙箱內的檔案：

```
deno sandbox copy ./frontend sbx_ord_abc123def456:/app/web/
```

## 部署沙箱

您可以使用 `deno sandbox deploy` 指令，將正在運行的沙箱部署為 Deno Deploy 應用程式：

```
deno sandbox deploy sbx_ord_abc123def456 my-app
```

預設會部署到預覽部署（preview deployment）。若要直接部署到正式環境：

```
deno sandbox deploy --prod sbx_ord_abc123def456 my-app
```

您可以指定自訂工作目錄與進入點：

```
deno sandbox deploy --cwd /app --entrypoint main.ts sbx_ord_abc123def456 my-app
```

若要將參數傳給進入點腳本：

```
deno sandbox deploy --args --port 8080 sbx_ord_abc123def456 my-app
```

## 管理磁碟區

沙箱系統支援持久性磁碟區，可用於需要跨沙箱實例保留的資料。使用 `deno sandbox volumes` 指令管理磁碟區。

### 建立磁碟區

建立具有指定名稱、容量與區域的新磁碟區：

```
deno sandbox volumes create my-volume --capacity 10gb --region ord
```

### 列出磁碟區

列出您組織中的所有磁碟區：

```
deno sandbox volumes list
```

您也可以搜尋特定磁碟區：

```
deno sandbox volumes list my-volume
```

### 刪除磁碟區

在不再需要某個磁碟區時將其刪除：

```
deno sandbox volumes delete my-volume
```

## 管理快照

快照是由磁碟區建立的唯讀映像。您可以先安裝好軟體一次，之後用快照立即啟動已準備完成的新沙箱。完整流程請參考[磁碟區與快照](volumes.md)。

### 建立快照

從現有磁碟區建立快照：

```
deno sandbox snapshots create my-volume my-snapshot
```

### 列出快照

列出您組織中的所有快照：

```
$ deno sandbox snapshots list
ID                             SLUG          REGION   ALLOCATED    BOOTABLE
snp_ord_spmbe47dysccpy277ma6   my-snapshot   ord      217.05 MiB   TRUE
```

### 刪除快照

在不再需要快照時將其刪除：

```
deno sandbox snapshots delete my-snapshot
```

## 切換組織

`deno sandbox switch` 指令可讓您在設定中的不同組織之間切換：

```
deno sandbox switch
```

這在需要同時操作多個組織時很實用。

## 互動式存取

當您需要在沙箱內進行互動式操作時，例如編輯檔案、除錯問題或探索環境，可以使用 `deno sandbox ssh`：

```
deno sandbox ssh sbx_ord_abc123def456
```

這會提供您一個沙箱內的完整 Linux shell，您可以使用任何命令列工具、用 vim 或 nano 編輯檔案、監看程序，或視需要安裝額外軟體。即使您中斷連線，沙箱仍會持續運行，因此您稍後可以重新連線，或改用其他指令進行遠端操作。

## 管理沙箱逾時

### 延長沙箱運行時間

有時您會需要更多時間在運行中的沙箱完成工作。`deno sandbox extend` 指令可讓您延長任何運行中沙箱的逾時時間，而不會中斷正在執行的程序：

```
deno sandbox extend sbx_ord_abc123def456 30m
```

`extend` 指令可與各種沙箱狀態無縫配合，不論您是否正透過 SSH 連入、執行遠端命令，或有背景程序正在運作。沙箱的到期時間會更新，而所有連線與程序都不會中斷。

### 清理與終止

完成使用後，請用 `deno sandbox kill`（或 `deno sandbox rm`）終止沙箱並釋放資源：

```
deno sandbox kill sbx_ord_abc123def456
```

這會立即停止沙箱中的所有程序並釋放資源。請務必先保存重要工作，因為沙箱內的所有資料都會遺失。

## 常見工作流程

### 開發與測試

典型的開發流程通常是：建立含有程式碼的沙箱、安裝相依套件，然後執行測試：

```
deno sandbox create --copy ./my-app
```

建立完成後，使用回傳的沙箱 ID 來安裝與測試您的專案：

```
deno sandbox exec sbx_ord_abc123def456 --cwd /app npm install
deno sandbox exec sbx_ord_abc123def456 --cwd /app npm test
```

當您在本機做了修改後，可以更新沙箱內容，並在完成後取回產生的檔案：

```
deno sandbox copy ./src/ sbx_ord_abc123def456:/app/src/
deno sandbox copy sbx_ord_abc123def456:/app/build/ ./dist/
deno sandbox kill sbx_ord_abc123def456
```

### 資料處理

在需要取回結果的資料處理流程中，可以結合遠端執行與 SSH 存取：

```
SANDBOX_ID=$(deno sandbox create --timeout 20m --copy ./data)
deno sandbox exec $SANDBOX_ID --cwd /app "deno run -A main.ts"
```

您也可以透過 pipe 將資料直接串流到沙箱程序，這對大型資料集或即時處理特別實用：

```
SANDBOX_ID=$(deno sandbox create --timeout 20m --copy ./processing-scripts)
curl -s https://api.example.com/data.json | deno sandbox exec $SANDBOX_ID --cwd /app jq '.items[] | select(.active)'
```

也可以把本機與遠端處理串成同一條資料管線：

```
grep "ERROR" /var/log/app.log | deno sandbox exec $SANDBOX_ID --cwd /app "deno run -A main.ts" | sort | uniq -c
```

完成後，將產生的檔案複製回本機，再清理沙箱：

```
deno sandbox copy $SANDBOX_ID:/app/results/*.csv ./output/
deno sandbox kill $SANDBOX_ID
```
