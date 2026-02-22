# Getting started

To use Deno Sandbox, you need a Deno Deploy account. If you do not have one yet
you can sign up for a free account at
[console.deno.com](https://console.deno.com).

## Access the Deno Sandbox dashboard

1. Visit [console.deno.com](https://console.deno.com/) and sign in with your
   Deploy account.
2. Choose or create the organization where you want to run Deno Sandbox.
3. Open the **Sandboxes** tab to view existing sandboxes, lifetime usage, and
   access tokens.

Deno Sandbox and Deno Deploy apps share the same organization boundary, so you
can reuse members, tokens, and observability settings across both products.

## Create an organization token

The `@deno/sandbox` SDK authenticates using the `DENO_DEPLOY_TOKEN` environment
variable. Generate it from **Settings → Organization tokens**, copy the value,
and store it securely. Then export it in your local shell or CI job:

```
export DENO_DEPLOY_TOKEN=<your-token>
```

![The Deno Deploy organization tokens screen.](../assets/sandbox/images/org-tokens.webp)

Token security

Treat this token like any other production secret. Rotate it from the dashboard
if it is ever exposed.

## Install the SDK

The SDK works in both Deno and Node.js environments.

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

The SDK works in Python versions `>=3.10`.

```
# Install with uv
uv add deno-sandbox

# or with pip
pip install deno-sandbox
```

## Create your first sandbox

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

## Run your sandbox code

This code will require access to the network to reach the Deploy edge where the
sandbox will be created, and also access to the environment variables to
authenticate with the Deploy API, so we'll pass in the `--allow-net` and
`--allow-env` flags to the `deno run` command (or use the shorthand `-EN`).

```
deno -EN main.ts
```

To run the script we just created, execute:

```
uv run main.py
```

Any sandbox you create will be listed in the **Sandboxes** tab of your Deno
Deploy organization.

![The list of sandboxes created in the Deno Deploy console.](../assets/sandbox/images/sandbox-list.webp)

Details about the sandbox will be shown in its **Event log**.

![The sandbox event log details in the Deno Deploy console.](../assets/sandbox/images/sandbox-event-log.webp)

## Configuring your sandbox

When creating a sandbox with `Sandbox.create()`, you can configure it with the
following options:

- `allowNet``allow_net`:
  Optional list of allowed outbound hosts. See
  [Outbound network control](security.md#outbound-network-control).
- `secrets`: Secret substitution rules for outbound requests. See
  [Secret redaction and substitution](security.md#secret-redaction-and-substitution).
- `region`: Deploy region where the sandbox will be created.
- `memoryMb``memory_mb`:
  Amount of memory allocated to the sandbox.
- `timeout`: Timeout of the sandbox.
- `labels`: Arbitrary key/value tags to help identify and manage sandboxes

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

## Running commands and scripts

Deno Sandbox exposes familiar filesystem and process APIs to run commands,
upload files, and spawn long-running services.

You can for example list files in the root directory:

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

Or upload a script from the local filesystem and run it:

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

You can keep state between commands, stream stdout and stderr, or open an
interactive REPL for agent-style workflows.

## Deploying from a Deno Sandbox

The snippet below walks through an end-to-end workflow: it creates a Deploy app,
boots a high-memory sandbox for heavier builds, scaffolds and builds a Next.js
project inside that VM, then calls `sandbox.deno.deploy()` to push the compiled
artifacts while streaming build logs back to your terminal.

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

## Tuning timeout, cleanup, and reconnect

- `timeout: "session"` (default) destroys the VM once your script finishes.
- Provide durations such as `"5m"` to keep the sandbox alive even after the
  client disconnects. You can later `Sandbox.connect({ id })` to resume work.
- Cleanup happens automatically when your code drops the last reference (or the
  `await using` block ends). Call `sandbox.kill()` only if you need to tear the
  VM down ahead of that schedule.

Observability is shared with Deno Deploy: every sandbox logs, trace, and metric
is visible in the Deno Deploy dashboard so you can debug agent runs the same way
you debug production apps.
