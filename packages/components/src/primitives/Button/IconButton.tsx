import type React from "react"
import { Button, type ButtonSize, type ButtonVariant } from "./Button.js"

export type IconButtonProps = Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "children" | "aria-label"
> & {
    icon: React.ReactNode
    label: string
    variant?: ButtonVariant
    size?: ButtonSize
    dataTrackNote?: string
}

export function IconButton({ icon, label, variant = "ghost", size = "md", ...props }: IconButtonProps) {
    return (
        <Button
            {...props}
            variant={variant}
            size={size}
            icon={null}
            iconLeft={icon}
            ariaLabel={label}
        />
    )
}

export default IconButton
