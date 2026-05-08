import "@testing-library/jest-dom/vitest"

// happy-dom 20.x raises an AbortError from `teardownWindow` whenever a test
// finishes with an in-flight fetch (it calls AsyncTaskManager.abortAll, which
// rejects each pending fetch). The rejection has no .catch handler since the
// caller is gone, so it surfaces as an unhandledRejection.
//
// Vitest itself still reports every test as passing and exits 0, but newer
// bun versions (CI runs `bun-version: latest`) treat that unhandledRejection
// as a fatal error and terminate the workspace runner with exit 1. Swallow
// the specific teardown-induced AbortError so CI exit code matches the test
// outcome.
if (typeof process !== "undefined" && process.on) {
    process.on("unhandledRejection", (reason: unknown) => {
        const err = reason as { name?: string; message?: string } | null
        if (err && err.name === "AbortError") return
        throw reason
    })
}
