export async function copyDir(src: string, dest: string): Promise<void> {
  await Deno.mkdir(dest, { recursive: true });
  for await (const entry of Deno.readDir(src)) {
    const from = `${src}/${entry.name}`;
    const to = `${dest}/${entry.name}`;
    if (entry.isDirectory) {
      await copyDir(from, to);
    } else if (entry.isFile) {
      await Deno.mkdir(to.substring(0, to.lastIndexOf('/')), { recursive: true });
      await Deno.copyFile(from, to);
    }
  }
}

export async function emptyDir(dir: string): Promise<void> {
  await Deno.remove(dir, { recursive: true }).catch(() => {});
  await Deno.mkdir(dir, { recursive: true });
}
