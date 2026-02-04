import { mkdir, cp, rm } from "node:fs/promises"
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

const copyScssFiles = async () => {
    const glob = new Glob("**/*.scss")
    const srcDir = "src"
    const distDir = "dist"

    for await (const file of glob.scan(srcDir)) {
        const srcPath = join(srcDir, file)
        const destPath = join(distDir, file)
        const destDir = dirname(destPath)

        await mkdir(destDir, { recursive: true })
        await cp(srcPath, destPath)
    }
}

const build = async () => {
    console.log("Cleaning dist directory...")
    if (existsSync("dist")) {
        await rm("dist", { recursive: true })
    }
    await mkdir("dist", { recursive: true })

    console.log("Copying SCSS files to dist...")
    await copyScssFiles()

    console.log("Compiling TypeScript to JavaScript...")
    await runCommand("npx", ["tsc", "--project", "tsconfig.build.json"])

    console.log("Build complete!")
}

build().catch((err) => {
    console.error("Build failed:", err)
    process.exit(1)
})
