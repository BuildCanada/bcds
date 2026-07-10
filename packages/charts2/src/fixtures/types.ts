/** A committed fixture dataset: raw CSV text + raw (pre-parse) manifest JSON. */
export interface Fixture {
    name: string
    csv: string
    /** Raw manifest object, exactly as it would appear in manifest.json. */
    manifest: Record<string, unknown>
}
