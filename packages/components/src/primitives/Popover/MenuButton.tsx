import cx from "classnames"
import { useRef } from "react"
import type React from "react"
import { Button, type ButtonSize, type ButtonVariant } from "../Button/index.js"
import { Popover, type PopoverPlacement } from "./Popover.js"

export interface MenuButtonItem {
    label: React.ReactNode
    value?: string
    disabled?: boolean
    href?: string
    onSelect?: () => void
}

export interface MenuButtonProps {
    label: string
    items: MenuButtonItem[]
    buttonProps?: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children" | "aria-label"> & {
        variant?: ButtonVariant
        size?: ButtonSize
        dataTrackNote?: string
    }
    placement?: PopoverPlacement
    open?: boolean
    defaultOpen?: boolean
    onOpenChange?: (open: boolean) => void
    className?: string
}

export function MenuButton({
    label,
    items,
    buttonProps,
    placement = "bottom-start",
    open,
    defaultOpen,
    onOpenChange,
    className,
}: MenuButtonProps) {
    const itemRefs = useRef<Array<HTMLAnchorElement | HTMLButtonElement | null>>([])

    const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        const enabledIndexes = items
            .map((item, index) => (!item.disabled ? index : -1))
            .filter((index) => index >= 0)
        if (!enabledIndexes.length) return
        const activeIndex = itemRefs.current.findIndex((item) => item === document.activeElement)
        const currentEnabledIndex = Math.max(0, enabledIndexes.indexOf(activeIndex))

        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault()
            const delta = event.key === "ArrowUp" ? -1 : 1
            const nextEnabledIndex = (currentEnabledIndex + delta + enabledIndexes.length) % enabledIndexes.length
            itemRefs.current[enabledIndexes[nextEnabledIndex]]?.focus()
        }
        if (event.key === "Home") {
            event.preventDefault()
            itemRefs.current[enabledIndexes[0]]?.focus()
        }
        if (event.key === "End") {
            event.preventDefault()
            itemRefs.current[enabledIndexes[enabledIndexes.length - 1]]?.focus()
        }
    }

    return (
        <Popover
            open={open}
            defaultOpen={defaultOpen}
            onOpenChange={onOpenChange}
            placement={placement}
            panelRole="menu"
            className={className}
            trigger={
                <Button
                    {...buttonProps}
                    text={label}
                    ariaLabel={label}
                />
            }
        >
            {({ close }) => (
                <div className="bc-menu-button" onKeyDown={handleMenuKeyDown}>
                    {items.map((item, index) => {
                        const commonProps = {
                            ref: (node: HTMLAnchorElement | HTMLButtonElement | null) => {
                                itemRefs.current[index] = node
                            },
                            role: "menuitem",
                            className: cx("bc-menu-button__item", { "bc-menu-button__item--disabled": item.disabled }),
                            tabIndex: item.disabled ? -1 : 0,
                            "aria-disabled": item.disabled,
                            onClick: (event: React.MouseEvent) => {
                                if (item.disabled) {
                                    event.preventDefault()
                                    return
                                }
                                item.onSelect?.()
                                close()
                            },
                        }

                        if (item.href) {
                            return (
                                <a key={item.value ?? index} href={item.disabled ? undefined : item.href} {...commonProps}>
                                    {item.label}
                                </a>
                            )
                        }

                        return (
                            <button key={item.value ?? index} type="button" disabled={item.disabled} {...commonProps}>
                                {item.label}
                            </button>
                        )
                    })}
                </div>
            )}
        </Popover>
    )
}

export default MenuButton
