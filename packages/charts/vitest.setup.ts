import "@testing-library/jest-dom/vitest"
import { vi } from "vitest"

// Stub global fetch so tests never open real network sockets.
//
// Why: components like GlobalEntitySelector call getUserCountryInformation
// (utils/Util.ts) on mount, which fetches COUNTRY_DETECTION_URL. Under
// happy-dom 20.x that opens a real Node TLSSocket; vitest's per-file window
// teardown then aborts the socket and the resulting synchronous 'error'
// event escapes the Promise chain and surfaces as a vitest "Uncaught
// Exception". Tests all pass but the run exits 1, which CI's
// `bun-version: latest` propagates as
// `error: script "test" exited with code 1`.
//
// Resolve (rather than reject) with a benign empty-JSON response so the stub
// can't itself create unhandled rejections in callers that don't .catch.
// getUserCountryInformation parses .json() and reads .country, which is
// undefined in {}, matching the production "could-not-detect" branch.
vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers({ "Content-Type": "application/json" }),
        json: async () => ({}),
        text: async () => "",
        arrayBuffer: async () => new ArrayBuffer(0),
        blob: async () => new Blob([]),
        clone() {
            return this
        },
    })) as unknown as typeof fetch,
)
