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
    // Copy SCSS, JSON, and existing JS files
    const glob = new Glob("**/*.{scss,json,js}")
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

const transpileFile = async (srcPath: string, destPath: string) => {
    const content = await readFile(srcPath, "utf-8")
    const isTsx = srcPath.endsWith(".tsx")

    const result = await transform(content, {
        loader: isTsx ? "tsx" : "ts",
        format: "esm",
        target: "esnext",
        sourcemap: "external",
        sourcefile: srcPath,
        tsconfigRaw: {
            compilerOptions: {
                experimentalDecorators: false,
                useDefineForClassFields: true,
            },
        },
    })

    const destDir = dirname(destPath)
    await mkdir(destDir, { recursive: true })
    await writeFile(destPath, result.code)
    if (result.map) {
        await writeFile(destPath + ".map", result.map)
    }
}

const build = async () => {
    console.log("Cleaning dist directory...")
    if (existsSync("dist")) {
        await rm("dist", { recursive: true })
    }
    await mkdir("dist", { recursive: true })

    console.log("Copying asset files (SCSS, JSON) to dist...")
    await copyAssetFiles()

    console.log("Transpiling TypeScript files with esbuild...")
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
    console.log(`Transpiled ${tasks.length} files`)

    console.log("Generating type declarations...")
    await runCommand("npx", [
        "tsc",
        "--project",
        "tsconfig.build.json",
        "--emitDeclarationOnly",
    ])

    console.log("Build complete!")
}

build().catch((err) => {
    console.error("Build failed:", err)
    process.exit(1)
})
