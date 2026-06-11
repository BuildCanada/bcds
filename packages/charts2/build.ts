import { mkdir, cp, rm, chmod, readFile, writeFile } from "node:fs/promises"
import { spawn } from "node:child_process"
import { existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { Glob } from "bun"

const runCommand = (command: string, args: string[]): Promise<void> => {
    return new Promise((resolve, reject) => {
        const proc = spawn(command, args, { stdio: "inherit" })
        proc.on("close", (code) => {
            if (code === 0) resolve()
            else reject(new Error(`${command} exited with code ${code}`))
        })
    })
}

// SCSS and committed font-metrics JSON ship alongside the compiled JS.
// Brand font binaries (woff2) are intentionally NOT copied: the published
// package must not redistribute licensed fonts (see specs/28-architecture.md).
const copyAssets = async () => {
    const srcDir = "src"
    const distDir = "dist"
    for (const pattern of ["**/*.scss", "fonts/metrics/*.json"]) {
        const glob = new Glob(pattern)
        for await (const file of glob.scan(srcDir)) {
            const destPath = join(distDir, file)
            await mkdir(dirname(destPath), { recursive: true })
            await cp(join(srcDir, file), destPath)
        }
    }
}

const makeBinExecutable = async () => {
    const binPath = "dist/cli/index.js"
    if (!existsSync(binPath)) return
    const content = await readFile(binPath, "utf8")
    if (!content.startsWith("#!")) {
        await writeFile(binPath, `#!/usr/bin/env node\n${content}`)
    }
    await chmod(binPath, 0o755)
}

const build = async () => {
    console.log("Cleaning dist directory...")
    if (existsSync("dist")) {
        await rm("dist", { recursive: true })
    }
    await mkdir("dist", { recursive: true })

    console.log("Copying assets to dist...")
    await copyAssets()

    console.log("Compiling TypeScript...")
    await runCommand("npx", ["tsc", "--project", "tsconfig.build.json"])

    console.log("Making CLI bin executable...")
    await makeBinExecutable()

    console.log("Build complete!")
}

build().catch((err) => {
    console.error("Build failed:", err)
    process.exit(1)
})
