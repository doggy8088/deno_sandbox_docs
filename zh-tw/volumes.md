# 磁碟區與快照

Deno Sandbox 提供兩種儲存原語：

- **Volumes** - 可讀寫的區塊儲存。適合用於快取、資料庫，以及可跨工作階段保留的產物。
- **Snapshots** - 從磁碟區建立的唯讀映像。適合用來預先安裝軟體，讓沙箱在啟動時即可立即使用。您也可以從快照建立新的磁碟區。

## 磁碟區

持久性磁碟區可讓您將區域性的區塊儲存掛載到沙箱，讓資料在程序重啟或重新連線後仍能保留。這很適合用於套件快取、建置產物、SQLite 資料庫，或任何只需要少量持久儲存、但不想把程式碼升級成完整 Deno Deploy 應用程式的工作流程。

### 配置儲存空間

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

| 欄位 | 必填 | 說明 |
| --- | --- | --- |
| `slug` | ✅ | 在每個組織內必須唯一。Slug 會成為掛載中繼資料的一部分，請選擇有描述性的名稱。 |
| `region` | ✅ | 必須是可用的沙箱區域（目前為 `"ord"` 或 `"ams"`）。只有同區域的沙箱才能掛載該磁碟區。 |
| `capacity` | ✅ | 介於 300 MB 到 20 GB。可傳入位元組數字，或帶有 `GB/MB/KB`（十進位）或 `GiB/MiB/KiB`（二進位）單位的字串。 |

### 檢視與搜尋磁碟區

Volumes API 會回傳分頁結果，也能用 slug 或 UUID 取得單一紀錄。

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

`used` 欄位代表控制平面從底層叢集收到的最近一次估計值，可能會比實際狀況晚幾分鐘，因此規劃容量時請預留緩衝空間。

### 在沙箱內掛載磁碟區

建立沙箱時傳入 `volumes` 對應表。鍵是掛載路徑，值則是磁碟區 slug 或 ID。沙箱與磁碟區**必須位於同一區域**。

Note

`Sandbox.create()` 與 `client.sandboxes.create()` 等價，可依您的程式碼風格擇一使用。

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

掛載後的行為和一般目錄相同。您可以建立子資料夾、寫入二進位檔案，或直接從磁碟區執行程式。

### 安全刪除磁碟區

```
await client.volumes.delete("training-cache");
```

```
sdk.volumes.delete("training-cache")
```

```
await sdk.volumes.delete("training-cache")
```

刪除流程分成兩個步驟：

1. API 會立即將磁碟區標記為已刪除，使其無法再被新的沙箱請求掛載，並釋放 slug 供後續重複使用。
2. 背景工作會等待 24 小時後，才從叢集移除底層區塊儲存。這段寬限期可讓您在誤刪時聯絡支援。

在寬限期內，您無法掛載或讀取該磁碟區。

## 快照

快照是由磁碟區建立的唯讀映像。當沙箱以快照作為根目錄啟動時，整個檔案系統都會被快照內容取代。先執行一次 `apt-get install` 或 `npm install`，再把結果做成快照，之後每個沙箱都能在啟動時立即擁有完整安裝好的環境。

### 建立快照

工作流程如下：

1. 由基底映像建立**可開機磁碟區**
2. 以該磁碟區作為 `root`（可寫）啟動沙箱
3. 安裝軟體
4. 對磁碟區建立快照

從快照啟動的沙箱會在所有軟體已安裝完成的狀態下立即啟動。

磁碟區若是在建立時使用 `from` 選項，就會是**可開機（bootable）**。目前唯一可用的基底映像是 `builtin:debian-13`。

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

### 從快照開機

有了快照之後，在建立新沙箱時把它指定為 `root`。沙箱必須建立在與快照相同的區域：

```
await using sandbox = await client.sandboxes.create({
  region: "ord",
  root: "my-toolchain-snapshot", // snapshot slug or ID
});

// TypeScript and Node.js are already installed
await sandbox.sh`tsc --version`;
await sandbox.sh`node --version`;
```

沙箱會以快照的檔案系統作為根目錄啟動。工作階段期間的任何寫入都屬於暫時性變更，不會修改快照本身。

### 列出快照

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

新磁碟區會包含快照內容，且可完整寫入。您可以用它修改快照內容，再重新建立快照。

### 刪除快照

```
await client.snapshots.delete("my-toolchain-snapshot");
```

```
deno sandbox snapshots delete my-toolchain-snapshot
```

### 磁碟區 vs 快照

| 功能 | Volumes | Snapshots |
| --- | --- | --- |
| 存取 | 讀寫 | 唯讀 |
| 掛載位置 | 任一路徑；若可開機也可作為根目錄 | 僅根檔案系統 |
| 用途 | 快取、資料庫、安裝軟體 | 預先安裝軟體、工具鏈 |
| 並行使用 | 同一時間只能供一個沙箱使用 | 可同時供多個沙箱使用 |
| 區域 | 必須與沙箱區域一致 | 必須與沙箱區域一致 |
