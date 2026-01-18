import cx from "classnames"
import { useState } from "react"

export interface NavItem {
    label: string
    href: string
    dropdown?: NavItem[]
}

export interface HeaderProps {
    logo: React.ReactNode
    navItems?: NavItem[]
    cta?: {
        label: string
        href: string
    }
    announcement?: {
        text: string
        href?: string
        variant?: "default" | "auburn"
    }
    className?: string
    style?: React.CSSProperties
}

export function Header({
    logo,
    navItems = [],
    cta,
    announcement,
    className,
    style,
}: HeaderProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [openDropdown, setOpenDropdown] = useState<string | null>(null)

    const classes = cx("bc-header", className)

    return (
        <header className={classes} style={style}>
            {announcement && (
                <div
                    className={cx("bc-header__announcement", {
                        "bc-header__announcement--auburn":
                            announcement.variant === "auburn",
                    })}
                >
                    {announcement.href ? (
                        <a href={announcement.href}>{announcement.text}</a>
                    ) : (
                        <span>{announcement.text}</span>
                    )}
                </div>
            )}
            <div className="bc-header__main">
                <div className="bc-header__logo">{logo}</div>

                <nav className="bc-header__nav" aria-label="Main navigation">
                    <ul className="bc-header__nav-list">
                        {navItems.map((item) => (
                            <li
                                key={item.label}
                                className={cx("bc-header__nav-item", {
                                    "bc-header__nav-item--has-dropdown": item.dropdown,
                                })}
                                onMouseEnter={() =>
                                    item.dropdown && setOpenDropdown(item.label)
                                }
                                onMouseLeave={() =>
                                    item.dropdown && setOpenDropdown(null)
                                }
                            >
                                {item.dropdown ? (
                                    <>
                                        <button
                                            className="bc-header__nav-link bc-header__nav-link--dropdown"
                                            aria-expanded={openDropdown === item.label}
                                            aria-haspopup="true"
                                        >
                                            {item.label}
                                            <svg
                                                className="bc-header__dropdown-icon"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                                aria-hidden="true"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </button>
                                        {openDropdown === item.label && (
                                            <ul className="bc-header__dropdown">
                                                {item.dropdown.map((subItem) => (
                                                    <li key={subItem.label}>
                                                        <a
                                                            href={subItem.href}
                                                            className="bc-header__dropdown-link"
                                                        >
                                                            {subItem.label}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </>
                                ) : (
                                    <a href={item.href} className="bc-header__nav-link">
                                        {item.label}
                                    </a>
                                )}
                            </li>
                        ))}
                    </ul>
                </nav>

                {cta && (
                    <a href={cta.href} className="bc-header__cta">
                        {cta.label}
                    </a>
                )}

                <button
                    className="bc-header__mobile-toggle"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-expanded={mobileMenuOpen}
                    aria-label="Toggle navigation menu"
                >
                    <span className="bc-header__hamburger" />
                </button>
            </div>

            {/* Mobile Menu */}
            <div
                className={cx("bc-header__mobile-menu", {
                    "bc-header__mobile-menu--open": mobileMenuOpen,
                })}
            >
                <nav aria-label="Mobile navigation">
                    <ul className="bc-header__mobile-nav">
                        {navItems.map((item) => (
                            <li key={item.label}>
                                <a
                                    href={item.href}
                                    className="bc-header__mobile-link"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {item.label}
                                </a>
                                {item.dropdown && (
                                    <ul className="bc-header__mobile-subnav">
                                        {item.dropdown.map((subItem) => (
                                            <li key={subItem.label}>
                                                <a
                                                    href={subItem.href}
                                                    className="bc-header__mobile-link bc-header__mobile-link--sub"
                                                    onClick={() => setMobileMenuOpen(false)}
                                                >
                                                    {subItem.label}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        ))}
                    </ul>
                    {cta && (
                        <a
                            href={cta.href}
                            className="bc-header__mobile-cta"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            {cta.label}
                        </a>
                    )}
                </nav>
            </div>
        </header>
    )
}

export default Header
