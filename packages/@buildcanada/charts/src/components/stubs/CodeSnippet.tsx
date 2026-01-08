/**
 * Stub component for CodeSnippet.
 * This is a placeholder - the consuming application should provide
 * its own implementation if code snippet functionality is needed.
 */
import React from "react"

export interface CodeSnippetProps {
    code: string
    language?: string
}

export function CodeSnippet({ code }: CodeSnippetProps): React.ReactElement {
    return (
        <pre style={{ background: "#f5f5f5", padding: "1rem", overflow: "auto" }}>
            <code>{code}</code>
        </pre>
    )
}
