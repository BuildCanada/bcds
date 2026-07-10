import "@testing-library/jest-dom/vitest"
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { Button, IconButton } from "./index"

describe("Button", () => {
    it("passes through chart-facing aria attributes", () => {
        render(<Button text="Options" variant="secondary" aria-expanded="true" aria-controls="panel" icon={null} />)

        expect(screen.getByRole("button", { name: "Options" })).toHaveAttribute("aria-expanded", "true")
        expect(screen.getByRole("button", { name: "Options" })).toHaveAttribute("aria-controls", "panel")
    })

    it("renders an accessible icon-only button", () => {
        render(<IconButton label="Play timeline" icon={<span aria-hidden="true">▶</span>} aria-pressed="false" />)

        expect(screen.getByRole("button", { name: "Play timeline" })).toHaveAttribute("aria-pressed", "false")
    })
})
