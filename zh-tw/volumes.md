# 捲和快照

Deno Sandbox 提供了兩種儲存原語：

- **卷** – 讀寫區塊儲存。用於緩存、資料庫和
  跨會話持續存在的工件。
- **快照** – 從磁碟區建立的唯讀映像。用於預安裝
  軟體使沙箱在一切準備就緒後立即啟動。您還可以
  從快照建立新磁碟區。

## 卷

持久性卷可讓您將區域區塊儲存附加到沙箱，以便數據
在進程重新啟動和新連線後仍然存在。它們非常適合包裝
快取、建置工件、SQLite 資料庫或任何需要小型的工作流程
無需將程式碼提升到完整的 Deno Deploy 應用程式即可獲得持久性儲存量。

### 配置儲存

```
import { Client } from "@deno/sandbox";

const client = new Client();

const volume = await client.volumes.create({
  slug: "training-cache",
  region: "ord", // ord (Chicago) or ams (Amsterdam)
  capacity: "2GB", // accepts bytes or "1GB"/"512MB" style strings
});

console.log(volume);
// {
//   id: "8a0f...",
//   slug: "training-cache",
//   region: "ord",
//   capacity: 2147483648,
//   used: 0
// }
```

```
from deno_sandbox import DenoDeploy

sdk = DenoDeploy()

volume = sdk.volumes.create(
  slug="training-cache",
  region="ord",  # ord (Chicago) or ams (Amsterdam)
  capacity="2GB"  # accepts bytes or "1GB"/"512MB" style strings
)

print(volume)
# {
#   "id": "8a0f...",
#   "slug": "training-cache",
#   "region": "ord",
#   "capacity": 2147483648,
#   "used": 0
# }
```

```
from deno_sandbox import AsyncDenoDeploy

sdk = AsyncDenoDeploy()

volume = await sdk.volumes.create(
  slug="training-cache",
  region="ord",  # ord (Chicago) or ams (Amsterdam)
  capacity="2GB"  # accepts bytes or "1GB"/"512MB" style strings
)

print(volume)
# {
#   "id": "8a0f...",
#   "slug": "training-cache",
#   "region": "ord",
#   "capacity": 2147483648,
#   "used": 0
# }
```

|領域 |必填|詳情 |
| --- | --- | --- |
| `slug` | ✅ |每個組織都是唯一的。 Slug 成為掛載元資料的一部分，因此請選擇一些描述性的內容。 |
| `region` | ✅ |必須符合可用的沙箱區域（今天的 `"ord"` 或 `"ams"`）。只有同一區域的沙箱才能掛載該磁碟區。 |
| `capacity` | ✅ | 300MB 到 20GB 之間。傳遞帶有 `GB/MB/KB` （十進位）或 `GiB/MiB/KiB` （二進位）單位的多個位元組或字串。 |

### 檢查和搜尋體積

Volumes API 傳回分頁結果，並且可以透過 slug 取得單一記錄
或 UUID。

```
const page = await client.volumes.list({ search: "training" });
for (const vol of page.items) {
  console.log(vol.slug, vol.estimatedFlattenedSize, vol.capacity);
}

const vol = await client.volumes.get("training-cache");
```

```
page = sdk.volumes.list(search="training")
for vol in page.items:
  print(f"{vol['slug']} {vol['estimatedFlattenedSize']} {vol['capacity']}")

vol = sdk.volumes.get("training-cache")
```

```
page = await sdk.volumes.list(search="training")
async for vol in page:
  print(f"{vol['slug']} {vol['estimatedFlattenedSize']} {vol['capacity']}")

vol = await sdk.volumes.get("training-cache")
```

`used` 欄位報告控制平面收到的最新估計
來自底層集群。它可能會落後現實幾分鐘，所以總是
大小體積與淨空。

### 在沙箱內掛載卷

建立沙箱時傳遞 `volumes` 映射。鍵是安裝路徑和
值是卷段或 ID。沙箱和卷**必須位於
同一地區**。

筆記

`Sandbox.create()` 和 `client.sandboxes.create()` 是等效的 - 使用哪一個
適合您的程式碼風格。

```
import { Client, Sandbox } from "@deno/sandbox";

const client = new Client();
const volume = await client.volumes.create({
  slug: "dataset",
  region: "ord",
  capacity: "1GB",
});

// First run writes a file to the volume
{
  await using sandbox = await Sandbox.create({
    region: "ord",
    volumes: {
      "/data/dataset": volume.slug,
    },
    labels: { job: "prepare" },
  });

  await sandbox.fs.writeTextFile("/data/dataset/hello.txt", "Persist me!\n");
}

// A new sandbox—possibly started hours later—can read the same file
{
  await using sandbox = await Sandbox.create({
    region: "ord",
    volumes: {
      "/data/dataset": volume.id, // IDs work too
    },
  });

  const contents = await sandbox.fs.readTextFile("/data/dataset/hello.txt");
  console.log(contents); // "Persist me!"
}
```

```
from deno_sandbox import DenoDeploy

sdk = DenoDeploy()

volume = sdk.volumes.create(
  slug="dataset",
  region="ord",
  capacity="1GB"
)

# First run writes a file to the volume
with sdk.sandbox.create(
  region="ord",
  volumes={
    "/data/dataset": volume["slug"],
  },
  labels={"job": "prepare"}
) as sandbox:
  sandbox.fs.write_text_file("/data/dataset/hello.txt", "Persist me!\n")

# A new sandbox—possibly started hours later—can read the same file
with sdk.sandbox.create(
  region="ord",
  volumes={
    "/data/dataset": volume["id"],  # IDs work too
  }
) as sandbox:
  contents = sandbox.fs.read_text_file("/data/dataset/hello.txt")
  print(contents)  # "Persist me!"
```

```
from deno_sandbox import AsyncDenoDeploy

sdk = AsyncDenoDeploy()

volume = await sdk.volumes.create(
  slug="dataset",
  region="ord",
  capacity="1GB"
)

# First run writes a file to the volume
async with sdk.sandbox.create(
  region="ord",
  volumes={
    "/data/dataset": volume["slug"],
  },
  labels={"job": "prepare"}
) as sandbox:
  await sandbox.fs.write_text_file("/data/dataset/hello.txt", "Persist me!\n")

# A new sandbox—possibly started hours later—can read the same file
async with sdk.sandbox.create(
  region="ord",
  volumes={
    "/data/dataset": volume["id"],  # IDs work too
  }
) as sandbox:
  contents = await sandbox.fs.read_text_file("/data/dataset/hello.txt")
  print(contents)  # "Persist me!"
```

掛載的行為與常規目錄類似。您可以建立子資料夾，寫入二進位文件
文件，或直接從磁碟區執行程式。

### 安全刪除卷

```
await client.volumes.delete("training-cache");
```

```
sdk.volumes.delete("training-cache")
```

```
await sdk.volumes.delete("training-cache")
```

刪除過程分為兩步驟：

1. API 立即將該磁碟區標記為已刪除，從而將其與新磁碟區分離
   沙箱請求並釋放 slug 以供日後重複使用。
2. 後台作業在刪除底層區塊儲存之前等待 24 小時
   來自集群。此寬限期可讓您聯絡支援人員（如果磁碟區）
   被意外刪除。

在寬限期內，您無法安裝或讀取該磁碟區。

## 快照

快照是從磁碟區建立的唯讀映像。當沙箱啟動時
快照作為其根，整個檔案系統都被快照替換
內容。執行 `apt-get install` 或 `npm install` 一次，對結果進行快照，然後
每個未來的沙箱都會立即啟動並安裝所有內容。

### 建立快照

工作流程是：

1. 從基本映像建立**可啟動磁碟區**
2. 啟動一個沙箱，該卷為 `root` （可寫）
3. 安裝軟體
4. 快照磁碟區

從快照啟動的沙箱會立即啟動並安裝所有內容。

使用 `from` 選項建立磁碟區時，磁碟區是**可引導的**。現在
`builtin:debian-13` 是唯一可用的基礎映像。

```
import { Client } from "@deno/sandbox";

const client = new Client();

// 1. Create a bootable volume
const volume = await client.volumes.create({
  region: "ord",
  slug: "my-toolchain",
  capacity: "10GiB",
  from: "builtin:debian-13",
});

// 2. Boot a sandbox with the volume as root (writable)
await using sandbox = await client.sandboxes.create({
  region: "ord",
  root: volume.slug,
});

// 3. Install software
await sandbox.sh`apt-get update && apt-get install -y nodejs npm`;
await sandbox.sh`npm install -g typescript`;

// 4. Snapshot the volume
const snapshot = await client.volumes.snapshot(volume.id, {
  slug: "my-toolchain-snapshot",
});
```

```
# Create snapshot from a volume
deno sandbox snapshots create my-toolchain my-toolchain-snapshot
```

### 從快照啟動

獲得快照後，在建立新沙箱時將其用作 `root`。這
沙箱必須創建在與快照相同的區域中：

```
await using sandbox = await client.sandboxes.create({
  region: "ord",
  root: "my-toolchain-snapshot", // snapshot slug or ID
});

// TypeScript and Node.js are already installed
await sandbox.sh`tsc --version`;
await sandbox.sh`node --version`;
```

沙箱以快照的檔案系統作為根啟動。期間的任何寫入
會話是短暫的——它們不會修改快照。

### 清單快照

```
const page = await client.snapshots.list();
for (const snap of page.items) {
  console.log(snap.slug, snap.region, snap.bootable);
}
```

```
$ deno sandbox snapshots list
ID                             SLUG                    REGION   ALLOCATED    BOOTABLE
snp_ord_spmbe47dysccpy277ma6   my-toolchain-snapshot   ord      217.05 MiB   TRUE
```

### 從快照建立磁碟區

從快照建立新的可寫磁碟區：

```
const volume = await client.volumes.create({
  region: "ord",
  slug: "my-toolchain-fork",
  capacity: "10GiB",
  from: "my-toolchain-snapshot",
});
```

新磁碟區包含快照的內容並且完全可寫入。用這個
修改快照的內容，然後再次快照。

### 刪除快照

```
await client.snapshots.delete("my-toolchain-snapshot");
```

```
deno sandbox snapshots delete my-toolchain-snapshot
```

### 卷與快照

|特色 |卷 |快照|
| --- | --- | --- |
|存取 |讀寫 |唯讀 |
|掛載點|任何路徑，或根（如果可引導）|僅限根檔案系統 |
|使用案例 |快取、資料庫、安裝軟體|預先安裝軟體、工具鏈 |
|並發使用 |一次一個沙箱 |同時多個沙箱|
|地區 |必須匹配沙箱區域 |必須匹配沙箱區域 |
