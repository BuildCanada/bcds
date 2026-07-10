import { mkdir, cp, rm, readFile, writeFile } from "node:fs/promises"
import { spawn } from "node:child_process"
import { existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { Glob } from "bun"
import { transform } from "esbuild"

const runCommand = (command: string, args: string[]): Promise<void> => {
    return new Promise((resolve, reject) => {
        const proc = spawn(command, args, { stdio: "inherit" })
        proc.on("close", (code) => {
            if (code === 0) resolve()
            else reject(new Error(`${command} exited with code ${code}`))
        })
    })
}

const copyAssetFiles = async () => {
    const glob = new Glob("**/*.{scss,json}")

    for await (const file of glob.scan("src")) {
        const srcPath = join("src", file)
        const destPath = join("dist", file)
        await mkdir(dirname(destPath), { recursive: true })
        await cp(srcPath, destPath)
    }
}

const transpileFile = async (srcPath: string, destPath: string) => {
    const content = await readFile(srcPath, "utf-8")
    const result = await transform(content, {
        loader: srcPath.endsWith(".tsx") ? "tsx" : "ts",
        format: "esm",
        target: "esnext",
        sourcemap: "external",
        sourcefile: srcPath,
    })

    await mkdir(dirname(destPath), { recursive: true })
    await writeFile(destPath, result.code)
    if (result.map) await writeFile(destPath + ".map", result.map)
}

const build = async () => {
    if (existsSync("dist")) await rm("dist", { recursive: true })
    await mkdir("dist", { recursive: true })

    await copyAssetFiles()

    const glob = new Glob("**/*.{ts,tsx}")
    const tasks: Promise<void>[] = []

    for await (const file of glob.scan("src")) {
        if (
            !file.includes(".test.") &&
            !file.includes(".stories.") &&
            !file.includes(".spec.")
        ) {
            const srcPath = join("src", file)
            const destPath = join("dist", file.replace(/\.tsx?$/, ".js"))
            tasks.push(transpileFile(srcPath, destPath))
        }
    }

    await Promise.all(tasks)
    await runCommand("npx", [
        "tsc",
        "--project",
        "tsconfig.build.json",
        "--emitDeclarationOnly",
    ])
}

build().catch((err) => {
    console.error("Build failed:", err)
    process.exit(1)
})
