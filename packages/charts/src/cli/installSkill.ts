/**
 * charts install-skill - install the bundled charts CLI agent skill.
 *
 * The skill is stored in packages/charts/skills during development and copied
 * into dist/skills for published packages. This command supports both layouts.
 */

import { defineCommand } from "citty"
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs"
import { homedir } from "node:os"
import { basename, dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { CliUsageError } from "./errors.ts"

export const CHARTS_SKILL_NAME = "charts-cli"

export type SkillAgent = "auto" | "all" | "codex" | "claude"

export interface SkillInstallTarget {
    agent: string
    skillsRoot: string
    destination: string
}

interface InstallSkillArgs {
    agent?: string
    path?: string
    force: boolean
}

function expandHome(path: string): string {
    if (path === "~") return homedir()
    if (path.startsWith("~/")) return join(homedir(), path.slice(2))
    return path
}

function agentHome(agent: "codex" | "claude"): string {
    if (agent === "codex") return process.env.CODEX_HOME ?? join(homedir(), ".codex")
    return process.env.CLAUDE_HOME ?? join(homedir(), ".claude")
}

function skillsRootFor(agent: "codex" | "claude"): string {
    return join(agentHome(agent), "skills")
}

function parseAgent(value: string | undefined): SkillAgent {
    const agent = value ?? "auto"
    if (agent === "auto" || agent === "all" || agent === "codex" || agent === "claude") return agent
    throw new CliUsageError(`--agent must be one of: auto, all, codex, claude (got "${agent}")`)
}

function dedupeTargets(targets: SkillInstallTarget[]): SkillInstallTarget[] {
    const seen = new Set<string>()
    const out: SkillInstallTarget[] = []
    for (const target of targets) {
        if (seen.has(target.destination)) continue
        seen.add(target.destination)
        out.push(target)
    }
    return out
}

export function resolveSkillSourceDir(): string {
    const cliDir = dirname(fileURLToPath(import.meta.url))
    const candidates = [
        // Published build: dist/cli/installSkill.js -> dist/skills/charts-cli
        resolve(cliDir, "../skills", CHARTS_SKILL_NAME),
        // Source and monorepo dev: src/cli/installSkill.ts -> skills/charts-cli
        resolve(cliDir, "../../skills", CHARTS_SKILL_NAME),
    ]
    for (const candidate of candidates) {
        if (existsSync(join(candidate, "SKILL.md"))) return candidate
    }
    throw new CliUsageError(`Could not find bundled skill "${CHARTS_SKILL_NAME}"`)
}

export function resolveInstallTargets(args: { agent?: string; path?: string }): SkillInstallTarget[] {
    if (args.path !== undefined) {
        if (args.path === "") throw new CliUsageError("--path requires a value")
        const skillsRoot = resolve(expandHome(args.path))
        return [{ agent: "custom", skillsRoot, destination: join(skillsRoot, CHARTS_SKILL_NAME) }]
    }

    const agent = parseAgent(args.agent)
    const makeTarget = (name: "codex" | "claude"): SkillInstallTarget => {
        const skillsRoot = skillsRootFor(name)
        return { agent: name, skillsRoot, destination: join(skillsRoot, CHARTS_SKILL_NAME) }
    }

    if (agent === "codex" || agent === "claude") return [makeTarget(agent)]
    if (agent === "all") return dedupeTargets([makeTarget("codex"), makeTarget("claude")])

    const targets: SkillInstallTarget[] = []
    const codexHome = agentHome("codex")
    const claudeHome = agentHome("claude")
    if (process.env.CODEX_HOME !== undefined || existsSync(codexHome)) targets.push(makeTarget("codex"))
    if (process.env.CLAUDE_HOME !== undefined || existsSync(claudeHome)) targets.push(makeTarget("claude"))

    return dedupeTargets(targets.length > 0 ? targets : [makeTarget("codex")])
}

export function installSkill(args: { sourceDir: string; targets: SkillInstallTarget[]; force: boolean }): void {
    for (const target of args.targets) {
        if (basename(target.destination) !== CHARTS_SKILL_NAME) {
            throw new CliUsageError(`Internal error: destination must end with ${CHARTS_SKILL_NAME}`)
        }
        if (existsSync(target.destination)) {
            if (!args.force) {
                throw new CliUsageError(`Skill already exists at ${target.destination}; pass --force to replace it`)
            }
            rmSync(target.destination, { recursive: true, force: true })
        }
        mkdirSync(target.skillsRoot, { recursive: true })
        cpSync(args.sourceDir, target.destination, { recursive: true })
        process.stdout.write(`installed ${CHARTS_SKILL_NAME} for ${target.agent}: ${target.destination}\n`)
    }
}

export function runInstallSkill(args: InstallSkillArgs): void {
    const sourceDir = resolveSkillSourceDir()
    const targets = resolveInstallTargets(args)
    installSkill({ sourceDir, targets, force: args.force })
}

export const installSkillCommand = defineCommand({
    meta: {
        name: "install-skill",
        description: "Install the bundled charts CLI agent skill into Codex, Claude, or a custom skills directory",
    },
    args: {
        agent: {
            type: "string",
            description: "auto | all | codex | claude (default auto; auto installs into detected agent homes)",
        },
        path: {
            type: "string",
            description: "Custom agent skills directory; installs <path>/charts-cli and ignores --agent",
        },
        force: {
            type: "boolean",
            description: "Replace an existing charts-cli skill at the destination",
            default: false,
        },
    },
    run({ args }) {
        runInstallSkill(args as unknown as InstallSkillArgs)
    },
})
