/**
 * Minimal stub types for database tags.
 * These are simplified versions for type compatibility.
 */

export interface DbPlainTag {
    id: number
    name: string
    slug: string | null
    parentId?: number
}
