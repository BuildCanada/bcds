/**
 * Accent- and alias-tolerant fuzzy search (spec 07 §2, spec 22 §3).
 *
 * Port of charts v1 `utils/FuzzySearch.ts`, stripped of its fuzzysort and
 * lodash dependencies: a pure module with no imports. Matching is
 * case-insensitive and accent-folded ("quebec" finds "Québec") and works
 * over multiple keys per item (canonical name, French name, aliases,
 * codes), deduping to the best-scoring key per item:
 *   1. substring matches rank highest (earlier and tighter is better)
 *   2. in-order subsequence matches rank below, with a word-start bonus
 */

/** Strip combining diacritics: "Québec" → "Quebec", "Î.-P.-É." → "I.-P.-E.". */
export function foldAccents(input: string): string {
    return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

function normalize(input: string): string {
    return foldAccents(input).toLowerCase()
}

/**
 * Score a normalized query against a normalized target. Higher is better;
 * null means no match. Substring matches always outrank subsequence matches.
 */
export function fuzzyScore(query: string, target: string): number | null {
    if (query.length === 0) return null

    const index = target.indexOf(query)
    if (index >= 0) {
        return 1000 - index - (target.length - query.length) * 0.01
    }

    let score = 0
    let at = 0
    for (const ch of query) {
        if (ch === " ") continue
        const found = target.indexOf(ch, at)
        if (found < 0) return null
        const atWordStart = found === 0 || target[found - 1] === " " || target[found - 1] === "-"
        score += atWordStart ? 4 : 1
        score -= (found - at) * 0.01
        at = found + 1
    }
    return score
}

export interface FuzzySearcher<T> {
    /** Best-first matches; empty queries return no results. */
    search: (query: string) => T[]
}

/**
 * Build a searcher over `items`, each exposing one or more searchable keys
 * (e.g. name + aliases). Each item appears at most once in results, ranked
 * by its best-matching key. Result order is stable for equal scores.
 */
export function createFuzzySearch<T>(items: readonly T[], keysOf: (item: T) => readonly string[]): FuzzySearcher<T> {
    const entries = items.map((item) => ({
        item,
        keys: keysOf(item).map(normalize),
    }))

    return {
        search(rawQuery: string): T[] {
            const query = normalize(rawQuery.trim())
            if (query.length === 0) return []

            const scored: { item: T; score: number }[] = []
            for (const entry of entries) {
                let best: number | null = null
                for (const key of entry.keys) {
                    const score = fuzzyScore(query, key)
                    if (score !== null && (best === null || score > best)) best = score
                }
                if (best !== null) scored.push({ item: entry.item, score: best })
            }
            scored.sort((a, b) => b.score - a.score)
            return scored.map((s) => s.item)
        },
    }
}

/** Convenience predicate: does the query match any of the keys? Empty queries match. */
export function fuzzyMatches(query: string, keys: readonly string[]): boolean {
    const normalized = normalize(query.trim())
    if (normalized.length === 0) return true
    return keys.some((key) => fuzzyScore(normalized, normalize(key)) !== null)
}
