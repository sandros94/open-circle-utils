import { execSync } from "node:child_process"
import { existsSync } from "node:fs"
import { resolve } from "node:path"

const pkg = process.argv[2]
const extraArgs = process.argv.slice(3)

if (!pkg) {
  console.error("Usage: node scripts/release.mjs <package-name> [changelogen flags]")
  process.exit(1)
}

const pkgDir = resolve("packages", pkg)
if (!existsSync(pkgDir)) {
  console.error(`Package directory not found: ${pkgDir}`)
  process.exit(1)
}

// Find the last tag for this specific package (e.g., valibot-ast@0.0.1)
let lastTag = ""
try {
  lastTag = execSync(`git tag --list "${pkg}@*" --sort=-v:refname`, { encoding: "utf-8" })
    .split("\n")
    .filter(Boolean)[0] || ""
}
catch {
  // No tags yet — first release
}

const args = [
  lastTag ? `--from ${lastTag}` : "",
  "--bump",
  "--release",
  "--push",
  ...extraArgs,
].filter(Boolean).join(" ")

console.log(`Releasing ${pkg} from ${lastTag || "(initial)"}...`)
execSync(`pnpm changelogen ${args}`, { cwd: pkgDir, stdio: "inherit" })
