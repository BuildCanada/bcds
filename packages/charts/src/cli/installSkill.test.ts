import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"

import { CliUsageError } from "./errors.ts"
import { CHARTS_SKILL_NAME, installSkill, resolveInstallTargets, resolveSkillSourceDir } from "./installSkill.ts"

const tmpDirs: string[] = []

function makeTmpDir(): string {
    const dir = mkdtempSync(join(tmpdir(), "bcds-cli-skill-"))
    tmpDirs.push(dir)
    return dir
}

function makeSourceSkill(): string {
    const dir = join(makeTmpDir(), CHARTS_SKILL_NAME)
    mkdirSync(dir, { recursive: true })
    writeFileSync(
        join(dir, "SKILL.md"),
        [
            "---",
            `name: ${CHARTS_SKILL_NAME}`,
            "description: Test skill",
            "---",
            "",
            "# Test",
            "",
        ].join("\n"),
    )
    return dir
}

afterEach(() => {
    while (tmpDirs.length > 0) {
        rmSync(tmpDirs.pop() as string, { recursive: true, force: true })
    }
})

describe("resolveSkillSourceDir", () => {
    it("finds the bundled charts CLI skill", () => {
        const sourceDir = resolveSkillSourceDir()
        expect(readFileSync(join(sourceDir, "SKILL.md"), "utf8")).toContain(`name: ${CHARTS_SKILL_NAME}`)
    })
})

describe("resolveInstallTargets", () => {
    it("uses a custom skills directory when --path is provided", () => {
        const root = join(makeTmpDir(), "skills")
        expect(resolveInstallTargets({ agent: "claude", path: root })).toEqual([
            {
                agent: "custom",
                skillsRoot: root,
                destination: join(root, CHARTS_SKILL_NAME),
            },
        ])
    })

    it("rejects unknown agents", () => {
        expect(() => resolveInstallTargets({ agent: "cursor" })).toThrow(CliUsageError)
    })

    it("rejects an empty custom path", () => {
        expect(() => resolveInstallTargets({ path: "" })).toThrow(CliUsageError)
    })
})

describe("installSkill", () => {
    it("copies the skill to every target", () => {
        const sourceDir = makeSourceSkill()
        const skillsRoot = join(makeTmpDir(), "skills")
        const destination = join(skillsRoot, CHARTS_SKILL_NAME)

        installSkill({
            sourceDir,
            targets: [{ agent: "custom", skillsRoot, destination }],
            force: false,
        })

        expect(existsSync(join(destination, "SKILL.md"))).toBe(true)
    })

    it("refuses to overwrite unless --force is set", () => {
        const sourceDir = makeSourceSkill()
        const skillsRoot = join(makeTmpDir(), "skills")
        const destination = join(skillsRoot, CHARTS_SKILL_NAME)
        mkdirSync(destination, { recursive: true })
        writeFileSync(join(destination, "SKILL.md"), "old")

        expect(() =>
            installSkill({
                sourceDir,
                targets: [{ agent: "custom", skillsRoot, destination }],
                force: false,
            }),
        ).toThrow(CliUsageError)

        installSkill({
            sourceDir,
            targets: [{ agent: "custom", skillsRoot, destination }],
            force: true,
        })

        expect(readFileSync(join(destination, "SKILL.md"), "utf8")).toContain(`name: ${CHARTS_SKILL_NAME}`)
    })
})
