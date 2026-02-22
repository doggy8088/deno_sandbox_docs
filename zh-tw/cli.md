# 透過 CLI 管理

Deno CLI 包含用於管理 Deno Sandbox的內建指令
實例，允許您從您的電腦上建立、控制它們並與之交互
終端。

這種整合使 Deno Sandbox 管理在您現有的環境中感覺自然
Deno 工作流程。

## 創建您的第一個沙箱

最簡單的開始方法是使用 `deno sandbox create`。預設情況下，這
建立一個基於互動式會話的沙箱，自動開啟 SSH
準備好後連線：

```
deno sandbox create
```

如果 SSH 在您的系統上不可用，它將顯示連接訊息
反而。當您退出會話時，沙箱會自行清理。

對於開發工作，您經常需要將專案文件複製到
沙箱。 `--copy` 選項將檔案上傳到 `/app` 目錄中
沙箱：

```
deno sandbox create --copy ./my-project
```

您可以在建立過程中複製多個目錄：

```
deno sandbox create --copy ./src --copy ./config
```

如果您需要沙箱運行時間超過單一會話，請指定逾時
與 `--timeout`:

```
deno sandbox create --timeout 2m
```

您還可以建立具有自訂記憶體限制的沙箱：

```
deno sandbox create --memory 2gib
```

若要為 Web 應用程式公開 HTTP 連接埠：

```
deno sandbox create --expose-http 3000
```

您可以使用 `--volume` 旗標將持久性磁碟區安裝到沙箱：

```
deno sandbox create --volume my-volume:/data
```

要建立沙箱並立即運行命令：

```
deno sandbox create ls /
```

這對於建置和測試專案特別有用。您可以複製文件
並用一個命令運行建置過程：

```
deno sandbox create --copy ./app --cwd /app "npm i && npm start"
```

對於 Web 應用程序，您可以公開連接埠來存取正在執行的服務：

```
deno sandbox create --expose-http 3000 --copy ./web-app --cwd /app "npm i && npm run dev"
```

複雜的工作流程可以表示為引用的命令鏈：

```
deno sandbox create --copy ./app --cwd /app "npm install && npm test && npm run build"
```

## 查看您的 Deno Sandbox

使用 `deno sandbox list` （或 `deno sandbox ls`）查看您的所有沙箱
組織：

```
$ deno sandbox list
ID                             CREATED                  REGION   STATUS    UPTIME
sbx_ord_1at5nn58e77rtd11e3k3   2026-01-30 18:33:40.79   ord      running   26.9s
sbx_ord_fwnygdsnszfe5ghafyx8   2026-01-30 18:31:40.90   ord      stopped   5.1s
sbx_ord_4xqcyahb8ye2r5a643de   2026-01-30 18:29:59.10   ord      stopped   9.4s
```

這顯示了每個沙箱的 ID、建立時間、區域、狀態和正常運作時間。

## 遠端運行命令

`deno sandbox exec` 命令允許您在任何運行中執行單一命令
沙箱而不開啟互動式會話。這非常適合自動化，
CI/CD 管道，或快速一次性任務：

```
deno sandbox exec sbx_ord_abc123def456 ls -la
```

大多數時候，您需要在複製的目錄 `/app` 中工作
文件實時。使用 `--cwd` 設定工作目錄：

```
deno sandbox exec sbx_ord_abc123def456 --cwd /app npm install
```

對於腳本或自動化，請使用 `--quiet` 抑制命令輸出：

```
deno sandbox exec sbx_ord_abc123def456 --quiet --cwd /app npm test
```

您也可以透過引用整個命令來運行複雜的命令鏈：

```
deno sandbox exec sbx_ord_abc123def456 --cwd /app "npm install && npm test"
```

exec 指令可以自然地與 Unix 管道和標準輸入/輸出配合使用。你
可以將沙箱命令的輸出透過管道傳輸到本地工具：

```
deno sandbox exec sbx_ord_abc123def456 'ls -lh /' | wc -l
```

或將本地資料透過管道傳輸到沙箱進程中進行處理：

```
cat large-dataset.csv | deno sandbox exec sbx_ord_abc123def456 --cwd /app "deno run -A main.ts"
```

這使得可以輕鬆地將沙箱處理整合到更大的 Unix 工作流程中
和數據管道。

## 傳輸檔案

雖然您可以在 Deno Sandbox 建立期間複製文件，但您可能需要更新
或稍後檢索文件。 `deno sandbox copy` 指令（也可用作
`deno sandbox cp`) 向任何方向傳輸檔案：從本機到
Deno Sandbox，從 Deno Sandbox回到您的機器，甚至在之間
不同的沙箱。

將檔案從本機電腦複製到沙箱：

```
deno sandbox copy ./app.js sbx_ord_abc123def456:/app/
```

將文件從沙箱檢索到本機：

```
deno sandbox copy sbx_ord_abc123def456:/app/results.json ./output/
```

在不同沙箱之間複製文件：

```
deno sandbox copy sbx_ord_abc123def456:/app/data.csv sbx_ord_xyz789uvw012:/app/input/
```

您可以使用 glob 模式從 Deno Sandbox 複製多個檔案：

```
deno sandbox copy sbx_ord_abc123def456:/app/*.json ./config/
deno sandbox copy sbx_ord_abc123def456:/app/logs/*.log ./logs/
```

您可以一次複製多個檔案和目錄：

```
deno sandbox copy ./src/ ./package.json sbx_ord_abc123def456:/app/
```

可以自訂目標路徑以組織沙箱內的檔案：

```
deno sandbox copy ./frontend sbx_ord_abc123def456:/app/web/
```

## Deploy沙箱

您可以使用以下命令將正在運行的沙箱Deploy到 Deno Deploy 應用程式
`deno sandbox deploy` 指令：

```
deno sandbox deploy sbx_ord_abc123def456 my-app
```

預設情況下，這會Deploy到預覽Deploy。直接Deploy到
生產：

```
deno sandbox deploy --prod sbx_ord_abc123def456 my-app
```

您可以指定自訂工作目錄和入口點：

```
deno sandbox deploy --cwd /app --entrypoint main.ts sbx_ord_abc123def456 my-app
```

要將參數傳遞給入口點腳本：

```
deno sandbox deploy --args --port 8080 sbx_ord_abc123def456 my-app
```

## 管理磁碟區

沙箱系統支援需要生存的數據的持久卷
跨沙箱實例。使用 `deno sandbox volumes` 命令来管理它们。

### 創建卷

建立具有特定名稱、容量和區域的新磁碟區：

```
deno sandbox volumes create my-volume --capacity 10gb --region ord
```

### 清單卷

列出您組織中的所有磁碟區：

```
deno sandbox volumes list
```

您也可以搜尋特定磁碟區：

```
deno sandbox volumes list my-volume
```

### 刪除卷

當您不再需要某個磁碟區時將其刪除：

```
deno sandbox volumes delete my-volume
```

## 管理快照

快照是從磁碟區建立的唯讀映像。使用它們來預先安裝
軟體一次，然後立即啟動新的沙箱，一切準備就緒。看
[捲和快照](volumes.md) 完整的工作流程。

### 建立快照

從現有磁碟區建立快照：

```
deno sandbox snapshots create my-volume my-snapshot
```

### 清單快照

列出您組織中的所有快照：

```
$ deno sandbox snapshots list
ID                             SLUG          REGION   ALLOCATED    BOOTABLE
snp_ord_spmbe47dysccpy277ma6   my-snapshot   ord      217.05 MiB   TRUE
```

### 刪除快照

當您不再需要快照時刪除它：

```
deno sandbox snapshots delete my-snapshot
```

## 轉換組織

`deno sandbox switch` 指令允許您在不同的
您的配置中的組織：

```
deno sandbox switch
```

這在與多個組織合作時非常有用。

## 互動存取

當您需要在沙箱中互動工作時；無論是編輯文件，
除錯問題，或探索環境，可以使用 `deno sandbox ssh`：

```
deno sandbox ssh sbx_ord_abc123def456
```

這為您提供了沙箱內的完整 Linux shell，您可以在其中使用任何
命令列工具、使用 vim 或 nano 編輯檔案、監視進程或安裝
根據需要添加其他軟體。沙箱在您之後繼續運行
斷開連接，以便您可以稍後重新連接或使用其他命令與其交互
遠程。

## 管理沙箱超時

### 延長沙箱持續時間

有時您需要更多時間才能在運行的沙箱中完成工作。這
`deno sandbox extend` 指令可讓您延長任何正在執行的逾時
沙箱而不中斷正在進行的進程：

```
deno sandbox extend sbx_ord_abc123def456 30m
```

擴展命令可以與任何沙箱狀態無縫協作；無論你是否使用 SSH
進入其中，運行遠端命令，或運行後台進程。全部
活動連結和進程繼續不間斷，而沙箱的
過期時間已更新。

### 清理和終止

當您完成沙箱後，請使用 `deno sandbox kill` （或
`deno sandbox rm`) 終止它並釋放資源：

```
deno sandbox kill sbx_ord_abc123def456
```

這會立即停止沙箱中的所有進程並釋放其資源。
請務必在終止沙箱之前保存所有重要工作，因為所有數據
裡面會遺失。

## 常見工作流程

### 開發與測試

典型的開發工作流程涉及使用您的程式碼建立沙箱，
設定依賴關係並執行測試：

```
deno sandbox create --copy ./my-app
```

建立後，使用返回的沙箱 ID 來設定和測試您的專案：

```
deno sandbox exec sbx_ord_abc123def456 --cwd /app npm install
deno sandbox exec sbx_ord_abc123def456 --cwd /app npm test
```

當您在本地進行更改時，您可以更新沙箱並檢索任何
完成後產生的文件：

```
deno sandbox copy ./src/ sbx_ord_abc123def456:/app/src/
deno sandbox copy sbx_ord_abc123def456:/app/build/ ./dist/
deno sandbox kill sbx_ord_abc123def456
```

### 資料處理

對於需要檢索結果的資料處理工作流程，請使用
遠端執行和 SSH 存取的組合：

```
SANDBOX_ID=$(deno sandbox create --timeout 20m --copy ./data)
deno sandbox exec $SANDBOX_ID --cwd /app "deno run -A main.ts"
```

您還可以使用管道將資料直接串流到沙箱進程中，這是
對於大型資料集或即時處理特別有用：

```
SANDBOX_ID=$(deno sandbox create --timeout 20m --copy ./processing-scripts)
curl -s https://api.example.com/data.json | deno sandbox exec $SANDBOX_ID --cwd /app jq '.items[] | select(.active)'
```

或將本地和遠端處理結合在管道中：

```
grep "ERROR" /var/log/app.log | deno sandbox exec $SANDBOX_ID --cwd /app "deno run -A main.ts" | sort | uniq -c
```

要檢索結果，請將產生的檔案複製回本機，然後
清理：

```
deno sandbox copy $SANDBOX_ID:/app/results/*.csv ./output/
deno sandbox kill $SANDBOX_ID
```
