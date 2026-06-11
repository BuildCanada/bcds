/**
 * bcds-charts — CLI entry point (spec 24, spec 28 §5).
 *
 * Subcommands: render (definition → SVG/PNG), validate (all errors at once).
 * Exit codes: 0 success, 1 validation/render errors, 2 bad usage.
 *
 * No shebang in this source file — build.ts prepends `#!/usr/bin/env node`
 * to dist/cli/index.js and marks it executable.
 */

import { defineCommand, runCommand, showUsage, type CommandDef } from "citty"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { CliFailure, CliUsageError } from "./errors.ts"
import { renderCommand } from "./render.ts"
import { validateCommand } from "./validate.ts"

function packageVersion(): string {
    try {
        const path = join(dirname(fileURLToPath(import.meta.url)), "../../package.json")
        const parsed = JSON.parse(readFileSync(path, "utf8")) as { version?: string }
        return parsed.version ?? "0.0.0"
    } catch {
        return "0.0.0"
    }
}

const subCommands: Record<string, CommandDef> = {
    render: renderCommand as CommandDef,
    validate: validateCommand as CommandDef,
}

const main = defineCommand({
    meta: {
        name: "bcds-charts",
        version: packageVersion(),
        description: "Render and validate Build Canada chart definitions (spec 24)",
    },
    subCommands,
})

/**
 * citty's mri-style parser never consumes a bare "-" as a flag value, so
 * `--out -` (stdout) would parse as an empty --out plus a stray positional.
 * Normalize it to the equivalent `--out=-` form before parsing.
 */
export function normalizeRawArgs(rawArgs: readonly string[]): string[] {
    const out: string[] = []
    for (let i = 0; i < rawArgs.length; i++) {
        if (rawArgs[i] === "--out" && rawArgs[i + 1] === "-") {
            out.push("--out=-")
            i++
        } else {
            out.push(rawArgs[i])
        }
    }
    return out
}

async function run(argv: string[]): Promise<never> {
    const rawArgs = normalizeRawArgs(argv)
    const subName = rawArgs.find((arg) => !arg.startsWith("-"))

    try {
        if (rawArgs.includes("--help") || rawArgs.includes("-h")) {
            const sub = subName !== undefined ? subCommands[subName] : undefined
            if (sub !== undefined) await showUsage(sub, main)
            else await showUsage(main)
            process.exit(0)
        }
        if (rawArgs.length === 1 && rawArgs[0] === "--version") {
            process.stdout.write(`${packageVersion()}\n`)
            process.exit(0)
        }
        await runCommand(main, { rawArgs })
        process.exit(0)
    } catch (error) {
        if (error instanceof CliUsageError) {
            process.stderr.write(`${error.message}\n`)
            process.exit(2)
        }
        if (error instanceof CliFailure) {
            if (error.message !== "") process.stderr.write(`${error.message}\n`)
            process.exit(1)
        }
        // citty's CLIError: unknown subcommand, missing required argument, …
        if (error instanceof Error && error.name === "CLIError") {
            process.stderr.write(`${error.message}\n`)
            const sub = subName !== undefined ? subCommands[subName] : undefined
            if (sub !== undefined) await showUsage(sub, main)
            else await showUsage(main)
            process.exit(2)
        }
        const message = error instanceof Error ? (error.stack ?? error.message) : String(error)
        process.stderr.write(`${message}\n`)
        process.exit(1)
    }
}

await run(process.argv.slice(2))
