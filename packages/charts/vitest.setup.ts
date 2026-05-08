import "@testing-library/jest-dom/vitest"
import { vi } from "vitest"

// `getUserCountryInformation` (utils/Util.ts) calls `fetchWithRetry` against
// COUNTRY_DETECTION_URL when components like GlobalEntitySelector mount.
// Under happy-dom 20.x, that opens a real TLS socket, which is then aborted
// when vitest tears the window down — emitting a synchronous `error` event
// from Node's TLSSocket layer that escapes the Promise chain and surfaces as
// an Uncaught Exception. Vitest aggregates that into the run's exit code,
// so every test passes but the process exits 1 (and bun's workspace runner
// prints `error: script "test" exited with code 1`).
//
// Stub fetch with an immediate rejection so no real socket is ever opened.
// `getUserCountryInformation` already swallows fetch failures via its own
// `.catch(() => undefined)`, so behavior is unchanged for tests that don't
// otherwise rely on fetch (none currently do).
vi.stubGlobal(
    "fetch",
    vi.fn(() =>
        Promise.reject(
            new Error("fetch is disabled in tests (vitest.setup.ts)"),
        ),
    ),
)
