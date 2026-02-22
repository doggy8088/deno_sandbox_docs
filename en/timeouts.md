# Sandbox Timeouts

Sandboxes created by Deno Sandbox are intentionally ephemeral. They boot in
milliseconds, serve their purpose, and disappear—reducing the blast radius of
untrusted code and removing infrastructure chores. Still, you can control
exactly how long a sandbox stays alive and even reconnect later when debugging
is required.

## Default timeout: `"session"`

```
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

With no options set, the sandbox lives for the duration of your script. Once the
sandbox instance is closed, the microVM shuts down and frees all resources. This
keeps costs predictable and prevents orphaned infrastructure.

## Duration-based timeouts

Provide a duration string to keep a sandbox alive after the client disconnects:

```
const sandbox = await Sandbox.create({ timeout: "5m" });
const id = sandbox.id;
await sandbox.close(); // process can exit now

// later
const reconnected = await Sandbox.connect({ id });
```

```
sdk = DenoDeploy()

with sdk.sandbox.create(timeout="5m") as sandbox:
  sandbox_id = sandbox.id
  sandbox.close()  # process can exit now

# later
with sdk.sandbox.connect(sandbox_id) as reconnected:
  print(f"Reconnected to {reconnected.id}")
```

```
sdk = AsyncDenoDeploy()

async with sdk.sandbox.create(timeout="5m") as sandbox:
  sandbox_id = sandbox.id
  await sandbox.close()  # process can exit now

# later
async with sdk.sandbox.connect(sandbox_id) as reconnected:
  print(f"Reconnected to {reconnected.id}")
```

Supported suffixes: `s` (seconds) and `m` (minutes). Examples: `"30s"`, `"5m"`,
`"90s"`. Use this mode for manual inspection, SSH debugging, or when a bot needs
to resume work mid-way.

If you require a longer timeout, it is possible to promote a duration-based
sandbox to a Deno Deploy app using [`sandbox.deno.deploy()`](promote.md).

## Forcefully ending a sandbox

- `await sandbox.kill()` immediately stops the VM and releases the lifetime if
  you need to tear it down before it would naturally expire.
- Killing a sandbox invalidates exposed HTTP URLs, SSH sessions, and any
  attached volumes, but this also happens automatically when your code drops the
  last reference to the sandbox or the configured duration elapses.

## Extending the timeout of a sandbox

Add more time to a running sandbox without interrupting ongoing processes.

```
const newTimeout = await sandbox.extendTimeout("30m");
console.log(`Sandbox now expires at ${newTimeout}`);
```

```
deno sandbox extend sbx_ord_abc123def456 30m
```

All active connections and processes continue uninterrupted while the sandbox's
expiration time is updated.

## Related APIs

- [`Sandbox.create()`](create.md) – pass the `timeout` option when
  provisioning.
- `Sandbox.connect({ id })` – resume control of a duration-based sandbox.
- `Sandbox.kill()` – terminate early.
- [`Expose HTTP`](expose_http.md) and [`SSH`](ssh.md) – note that their
  URLs/credentials die with the sandbox lifetime.
