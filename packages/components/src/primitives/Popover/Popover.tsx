import cx from "classnames"
import { cloneElement, isValidElement, useEffect, useId, useRef, useState } from "react"
import type React from "react"

export type PopoverPlacement = "bottom-start" | "bottom-end" | "top-start" | "top-end" | "right" | "left"

export interface PopoverProps {
    trigger: React.ReactElement
    children: React.ReactNode | ((props: { close: () => void }) => React.ReactNode)
    open?: boolean
    defaultOpen?: boolean
    onOpenChange?: (open: boolean) => void
    placement?: PopoverPlacement
    modal?: boolean
    closeOnOutsideClick?: boolean
    returnFocusOnClose?: boolean
    id?: string
    className?: string
    panelClassName?: string
    panelRole?: "dialog" | "menu" | "listbox"
}

function getPanelPosition(trigger: HTMLElement, panel: HTMLElement, placement: PopoverPlacement) {
    const rect = trigger.getBoundingClientRect()
    const panelRect = panel.getBoundingClientRect()
    const gap = 8
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let top = rect.bottom + gap
    let left = rect.left

    if (placement.startsWith("top")) top = rect.top - panelRect.height - gap
    if (placement === "bottom-end" || placement === "top-end") left = rect.right - panelRect.width
    if (placement === "right") {
        top = rect.top
        left = rect.right + gap
    }
    if (placement === "left") {
        top = rect.top
        left = rect.left - panelRect.width - gap
    }

    return {
        top: clamp(top, gap, viewportHeight - panelRect.height - gap),
        left: clamp(left, gap, viewportWidth - panelRect.width - gap),
    }
}

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value))
}

export function Popover({
    trigger,
    children,
    open,
    defaultOpen = false,
    onOpenChange,
    placement = "bottom-start",
    modal = false,
    closeOnOutsideClick = true,
    returnFocusOnClose = true,
    id: providedId,
    className,
    panelClassName,
    panelRole = "dialog",
}: PopoverProps) {
    const generatedId = useId()
    const id = providedId || generatedId
    const [internalOpen, setInternalOpen] = useState(defaultOpen)
    const isOpen = open ?? internalOpen
    const triggerRef = useRef<HTMLElement | null>(null)
    const panelRef = useRef<HTMLDivElement | null>(null)
    const previousOpen = useRef(isOpen)
    const [position, setPosition] = useState<React.CSSProperties>({})

    const setOpen = (nextOpen: boolean) => {
        if (open === undefined) setInternalOpen(nextOpen)
        onOpenChange?.(nextOpen)
    }

    useEffect(() => {
        if (!isOpen || !triggerRef.current || !panelRef.current) return

        const updatePosition = () => {
            if (!triggerRef.current || !panelRef.current) return
            const nextPosition = getPanelPosition(triggerRef.current, panelRef.current, placement)
            setPosition({ position: "fixed", top: nextPosition.top, left: nextPosition.left })
        }

        updatePosition()
        window.addEventListener("resize", updatePosition)
        window.addEventListener("scroll", updatePosition, true)
        return () => {
            window.removeEventListener("resize", updatePosition)
            window.removeEventListener("scroll", updatePosition, true)
        }
    }, [isOpen, placement])

    useEffect(() => {
        if (!isOpen) return

        const handlePointerDown = (event: PointerEvent) => {
            if (!closeOnOutsideClick) return
            const target = event.target as Node
            if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return
            setOpen(false)
        }
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setOpen(false)
        }

        document.addEventListener("pointerdown", handlePointerDown, true)
        document.addEventListener("keydown", handleKeyDown)
        return () => {
            document.removeEventListener("pointerdown", handlePointerDown, true)
            document.removeEventListener("keydown", handleKeyDown)
        }
    }, [isOpen, closeOnOutsideClick])

    useEffect(() => {
        if (previousOpen.current && !isOpen && returnFocusOnClose) triggerRef.current?.focus()
        previousOpen.current = isOpen
    }, [isOpen, returnFocusOnClose])

    if (!isValidElement(trigger)) return null

    const triggerProps = trigger.props as React.HTMLAttributes<HTMLElement>
    const clonedTrigger = cloneElement(trigger, {
        ref: (node: HTMLElement | null) => {
            triggerRef.current = node
            const originalRef = (trigger as React.ReactElement & { ref?: React.Ref<HTMLElement> }).ref
            if (typeof originalRef === "function") originalRef(node)
            else if (originalRef && "current" in originalRef) originalRef.current = node
        },
        "aria-expanded": isOpen,
        "aria-controls": id,
        "aria-haspopup": panelRole === "menu" ? "menu" : "dialog",
        onClick: (event: React.MouseEvent<HTMLElement>) => {
            triggerProps.onClick?.(event)
            if (!event.defaultPrevented) setOpen(!isOpen)
        },
    } as React.HTMLAttributes<HTMLElement>)

    return (
        <div className={cx("bc-popover", className)}>
            {clonedTrigger}
            {isOpen && (
                <div
                    ref={panelRef}
                    id={id}
                    role={panelRole}
                    aria-modal={panelRole === "dialog" ? modal : undefined}
                    className={cx("bc-popover__panel", `bc-popover__panel--${placement}`, panelClassName)}
                    style={position}
                >
                    {typeof children === "function" ? children({ close: () => setOpen(false) }) : children}
                </div>
            )}
        </div>
    )
}

export default Popover
