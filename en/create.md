# Create a Deno Sandbox

The sandbox creation method is the primary entry point for provisioning an
isolated Linux microVM on the Deploy edge. It returns a connected sandbox
instance that you can use to run commands, upload files, expose HTTP endpoints,
or request SSH access.

```
import { Sandbox } from "@deno/sandbox";

await using sandbox = await Sandbox.create();
```

```
from deno_sandbox import DenoDeploy

sdk = DenoDeploy()

with sdk.sandbox.create() as sandbox:
  print(f"Sandbox {sandbox.id} is ready.")
```

```
from deno_sandbox import AsyncDenoDeploy

sdk = AsyncDenoDeploy()

async with sdk.sandbox.create() as sandbox:
  print(f"Sandbox {sandbox.id} is ready.")
```

By default, this creates an ephemeral sandbox in the closest Deploy region with
1280 MB of RAM, no outbound network access, and a timeout bound to the current
process. You can tailor the sandbox by passing an options object.

## Available options

| Option | Description |
| --- | --- |
| `region` | Eg `ams` or `ord` |
| `allowNet``allow_net` | Optional list of allowed outbound hosts. See [Outbound network control](security.md#outbound-network-control). |
| `secrets` | Secrets to substitute on outbound requests to approved hosts. See [Secret redaction and substitution](security.md#secret-redaction-and-substitution). |
| `memoryMb``memory_mb` | Allocate between 768 and 4096 MB of RAM for memory-heavy tasks or tighter budgets. |
| `timeout` | [How long the sandbox stays alive](timeouts.md) in (m) or (s) such as `5m` |
| `labels` | Attach arbitrary key/value labels to help identify and manage sandboxes |
| `env` | Environment variables to start the sandbox with. |

## Example configurations

### Allow outbound traffic to specific APIs

```
const sandbox = await Sandbox.create({
  allowNet: ["api.openai.com", "api.stripe.com"],
});
```

```
sdk = DenoDeploy()

with sdk.sandbox.create(
  allow_net=["api.openai.com", "api.stripe.com"]
) as sandbox:
  print(f"Sandbox {sandbox.id} is ready.")
```

```
sdk = AsyncDenoDeploy()

async with sdk.sandbox.create(
  allow_net=["api.openai.com", "api.stripe.com"]
) as sandbox:
  print(f"Sandbox {sandbox.id} is ready.")
```

### Configure secret substitution for approved hosts

```
const sandbox = await Sandbox.create({
  allowNet: ["api.openai.com"],
  secrets: {
    OPENAI_API_KEY: {
      hosts: ["api.openai.com"],
      value: process.env.OPENAI_API_KEY,
    },
  },
});
```

```
import os
from deno_sandbox import DenoDeploy

sdk = DenoDeploy()

with sdk.sandbox.create(
  allow_net=["api.openai.com"],
  secrets={
    "OPENAI_API_KEY": {
      "hosts": ["api.openai.com"],
      "value": os.environ.get("OPENAI_API_KEY"),
    }
  }
) as sandbox:
  print(f"Sandbox {sandbox.id} is ready.")
```

```
import os
from deno_sandbox import AsyncDenoDeploy

sdk = AsyncDenoDeploy()

async with sdk.sandbox.create(
  allow_net=["api.openai.com"],
  secrets={
    "OPENAI_API_KEY": {
      "hosts": ["api.openai.com"],
      "value": os.environ.get("OPENAI_API_KEY"),
    }
  }
) as sandbox:
  print(f"Sandbox {sandbox.id} is ready.")
```

### Run in a specific region with more memory

```
const sandbox = await Sandbox.create({
  region: "ams",
  memoryMb: 2048,
});
```

```
sdk = DenoDeploy()

with sdk.sandbox.create(
  region="ams",
  memory_mb=2048
) as sandbox:
  print(f"Sandbox {sandbox.id} is ready.")
```

```
sdk = AsyncDenoDeploy()

async with sdk.sandbox.create(
  region="ams",
  memory_mb=2048
) as sandbox:
  print(f"Sandbox {sandbox.id} is ready.")
```

### Keep the sandbox alive for later inspection

```
const sandbox = await Sandbox.create({ timeout: "10m" });
const id = sandbox.id;
await sandbox.close(); // disconnect but leave VM running

// ...later...
const reconnected = await Sandbox.connect({ id });
```

```
sdk = DenoDeploy()

with sdk.sandbox.create(timeout="10m") as sandbox:
  sandbox_id = sandbox.id
  sandbox.close()  # disconnect but leave VM running

# ...later...
with sdk.sandbox.connect(sandbox_id) as reconnected:
  print(f"Reconnected to {reconnected.id}")
```

```
sdk = AsyncDenoDeploy()

async with sdk.sandbox.create(timeout="10m") as sandbox:
  sandbox_id = sandbox.id
  await sandbox.close()  # disconnect but leave VM running

# ...later...
async with sdk.sandbox.connect(sandbox_id) as reconnected:
  print(f"Reconnected to {reconnected.id}")
```

### Provide default environment variables

```
const sandbox = await Sandbox.create({
  env: {
    NODE_ENV: "development",
    FEATURE_FLAG: "agents",
  },
});
```

```
sdk = DenoDeploy()

with sdk.sandbox.create(
  env={
    "NODE_ENV": "development",
    "FEATURE_FLAG": "agents",
  }
) as sandbox:
  print(f"Sandbox {sandbox.id} is ready.")
```

```
sdk = AsyncDenoDeploy()

async with sdk.sandbox.create(
  env={
    "NODE_ENV": "development",
    "FEATURE_FLAG": "agents",
  }
) as sandbox:
  print(f"Sandbox {sandbox.id} is ready.")
```

## Tips

- Keep network allowlists as narrow as possible to block exfiltration attempts.
- Use metadata keys such as `agentId` or `customerId` to trace sandboxes in the
  Deploy dashboard.
- Let context managers (Python) or automatic disposal (JavaScript) handle
  cleanup. Call `sandbox.kill()` only when you need to terminate it prior to
  that automatic cleanup.
- For long-lived services, migrate from a Deno Sandbox to a Deploy app once the
  code stabilizes.
