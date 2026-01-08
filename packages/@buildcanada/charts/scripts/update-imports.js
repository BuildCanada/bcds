#!/usr/bin/env node

/**
 * Script to update @ourworldindata/* imports to relative paths
 * within the @buildcanada/charts package.
 */

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SRC_DIR = path.join(__dirname, "..", "src")

// Map of @ourworldindata packages to their local directory names
const PACKAGE_MAP = {
    "@ourworldindata/types": "types",
    "@ourworldindata/utils": "utils",
    "@ourworldindata/core-table": "core-table",
    "@ourworldindata/components": "components",
    "@ourworldindata/grapher": "grapher",
    "@ourworldindata/explorer": "explorer",
}

function getAllFiles(dir, extensions = [".ts", ".tsx"]) {
    const files = []
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            files.push(...getAllFiles(fullPath, extensions))
        } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
            files.push(fullPath)
        }
    }

    return files
}

function getRelativePath(fromFile, toModule) {
    // Get the directory of the file
    const fileDir = path.dirname(fromFile)
    // Get the path to the target module from src/
    const targetPath = path.join(SRC_DIR, toModule)
    // Calculate relative path
    let relativePath = path.relative(fileDir, targetPath)

    // Ensure it starts with ./ or ../
    if (!relativePath.startsWith(".")) {
        relativePath = "./" + relativePath
    }

    return relativePath
}

function updateImports(filePath) {
    let content = fs.readFileSync(filePath, "utf8")
    let modified = false

    for (const [packageName, localDir] of Object.entries(PACKAGE_MAP)) {
        // Match various import patterns:
        // import { X } from "@ourworldindata/types"
        // import type { X } from "@ourworldindata/types"
        // import * as X from "@ourworldindata/types"
        // export { X } from "@ourworldindata/types"
        // export type { X } from "@ourworldindata/types"
        // export * from "@ourworldindata/types"

        // Escape the @ in the package name for regex
        const escapedPackage = packageName.replace("@", "\\@")

        // Pattern to match imports from this package
        const importRegex = new RegExp(
            `((?:import|export)\\s+(?:type\\s+)?(?:\\{[^}]*\\}|\\*(?:\\s+as\\s+\\w+)?)?\\s+from\\s+["'])${escapedPackage}(["'])`,
            "g"
        )

        const newRelativePath = getRelativePath(filePath, localDir)

        const newContent = content.replace(
            importRegex,
            `$1${newRelativePath}/index.js$2`
        )

        if (newContent !== content) {
            content = newContent
            modified = true
        }
    }

    if (modified) {
        fs.writeFileSync(filePath, content)
        return true
    }

    return false
}

function main() {
    console.log("Updating imports in @buildcanada/charts...")
    console.log(`Source directory: ${SRC_DIR}`)

    const files = getAllFiles(SRC_DIR)
    console.log(`Found ${files.length} TypeScript files`)

    let updatedCount = 0
    const updatedFiles = []

    for (const file of files) {
        if (updateImports(file)) {
            updatedCount++
            updatedFiles.push(path.relative(SRC_DIR, file))
        }
    }

    console.log(`\nUpdated ${updatedCount} files:`)
    if (updatedCount <= 50) {
        updatedFiles.forEach((f) => console.log(`  - ${f}`))
    } else {
        console.log(`  (${updatedCount} files - too many to list)`)
    }
}

main()
