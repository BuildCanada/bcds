/**
 * Pure rectangle math (ported from charts v1 Bounds, DOM and string-width
 * estimation stripped). Immutable: every operation returns a new Bounds.
 */

import type { Vec2 } from "../scene/nodes.ts"

export interface BoundsPadding {
    top?: number
    right?: number
    bottom?: number
    left?: number
}

export interface BoundsProps {
    x: number
    y: number
    width: number
    height: number
}

export interface GridParameters {
    rows: number
    columns: number
    /** Number of cells to produce (defaults to rows × columns). */
    count?: number
}

export interface GridPadding {
    columnPadding?: number
    rowPadding?: number
    outerPadding?: number
}

export class Bounds {
    static fromProps(props: BoundsProps): Bounds {
        return new Bounds(props.x, props.y, props.width, props.height)
    }

    static empty(): Bounds {
        return new Bounds(0, 0, 0, 0)
    }

    /** Merge a collection of bounds into a single encompassing Bounds. */
    static merge(boundsList: Bounds[]): Bounds {
        if (boundsList.length === 0) return Bounds.empty()
        let x1 = Infinity
        let y1 = Infinity
        let x2 = -Infinity
        let y2 = -Infinity
        for (const b of boundsList) {
            x1 = Math.min(x1, b.x)
            y1 = Math.min(y1, b.y)
            x2 = Math.max(x2, b.right)
            y2 = Math.max(y2, b.bottom)
        }
        return new Bounds(x1, y1, x2 - x1, y2 - y1)
    }

    readonly x: number
    readonly y: number
    readonly width: number
    readonly height: number

    constructor(x: number, y: number, width: number, height: number) {
        this.x = x
        this.y = y
        this.width = Math.max(width, 0)
        this.height = Math.max(height, 0)
    }

    get left(): number {
        return this.x
    }
    get top(): number {
        return this.y
    }
    get right(): number {
        return this.x + this.width
    }
    get bottom(): number {
        return this.y + this.height
    }
    get centerX(): number {
        return this.x + this.width / 2
    }
    get centerY(): number {
        return this.y + this.height / 2
    }
    get area(): number {
        return this.width * this.height
    }

    padLeft(amount: number): Bounds {
        return new Bounds(this.x + amount, this.y, this.width - amount, this.height)
    }

    padRight(amount: number): Bounds {
        return new Bounds(this.x, this.y, this.width - amount, this.height)
    }

    padTop(amount: number): Bounds {
        return new Bounds(this.x, this.y + amount, this.width, this.height - amount)
    }

    padBottom(amount: number): Bounds {
        return new Bounds(this.x, this.y, this.width, this.height - amount)
    }

    padWidth(amount: number): Bounds {
        return new Bounds(this.x + amount, this.y, this.width - amount * 2, this.height)
    }

    padHeight(amount: number): Bounds {
        return new Bounds(this.x, this.y + amount, this.width, this.height - amount * 2)
    }

    pad(amount: number | BoundsPadding): Bounds {
        if (typeof amount === "number") {
            return new Bounds(
                this.x + amount,
                this.y + amount,
                this.width - amount * 2,
                this.height - amount * 2,
            )
        }
        return this.padTop(amount.top ?? 0)
            .padRight(amount.right ?? 0)
            .padBottom(amount.bottom ?? 0)
            .padLeft(amount.left ?? 0)
    }

    expand(amount: number | BoundsPadding): Bounds {
        if (typeof amount === "number") return this.pad(-amount)
        return this.pad({
            top: -(amount.top ?? 0),
            right: -(amount.right ?? 0),
            bottom: -(amount.bottom ?? 0),
            left: -(amount.left ?? 0),
        })
    }

    /** The leftmost `amount` px of this bounds. */
    fromLeft(amount: number): Bounds {
        return this.padRight(this.width - amount)
    }

    /** The rightmost `amount` px of this bounds. */
    fromRight(amount: number): Bounds {
        return this.padLeft(this.width - amount)
    }

    /** The topmost `amount` px of this bounds. */
    fromTop(amount: number): Bounds {
        return this.padBottom(this.height - amount)
    }

    /** The bottommost `amount` px of this bounds. */
    fromBottom(amount: number): Bounds {
        return this.padTop(this.height - amount)
    }

    set(props: Partial<BoundsProps>): Bounds {
        return Bounds.fromProps({ ...this.toProps(), ...props })
    }

    scale(scale: number): Bounds {
        return new Bounds(this.x * scale, this.y * scale, this.width * scale, this.height * scale)
    }

    intersects(other: Bounds): boolean {
        return !(
            other.left > this.right ||
            other.right < this.left ||
            other.top > this.bottom ||
            other.bottom < this.top
        )
    }

    hasVerticalOverlap(other: Bounds): boolean {
        return !(other.top > this.bottom || other.bottom < this.top)
    }

    hasHorizontalOverlap(other: Bounds): boolean {
        return !(other.left > this.right || other.right < this.left)
    }

    containsPoint(x: number, y: number): boolean {
        return x >= this.left && x <= this.right && y >= this.top && y <= this.bottom
    }

    contains(p: Vec2): boolean {
        return this.containsPoint(p.x, p.y)
    }

    encloses(other: Bounds): boolean {
        return (
            this.containsPoint(other.left, other.top) &&
            this.containsPoint(other.right, other.bottom)
        )
    }

    /** Split into a rows × columns grid of cell bounds, row-major. */
    grid(params: GridParameters, padding: GridPadding = {}): Bounds[] {
        const { rows, columns } = params
        const count = params.count ?? rows * columns
        const { columnPadding = 0, rowPadding = 0, outerPadding = 0 } = padding
        const contentWidth = this.width - columnPadding * (columns - 1) - outerPadding * 2
        const contentHeight = this.height - rowPadding * (rows - 1) - outerPadding * 2
        const cellWidth = contentWidth / columns
        const cellHeight = contentHeight / rows
        const cells: Bounds[] = []
        for (let index = 0; index < count; index++) {
            const col = index % columns
            const row = Math.floor(index / columns)
            cells.push(
                new Bounds(
                    this.x + outerPadding + col * (cellWidth + columnPadding),
                    this.y + outerPadding + row * (cellHeight + rowPadding),
                    cellWidth,
                    cellHeight,
                ),
            )
        }
        return cells
    }

    equals(other: Bounds): boolean {
        return (
            this.x === other.x &&
            this.y === other.y &&
            this.width === other.width &&
            this.height === other.height
        )
    }

    toProps(): BoundsProps {
        return { x: this.x, y: this.y, width: this.width, height: this.height }
    }
}
