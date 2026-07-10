/**
 * Settings menu (spec 10 §4): a gear button opening a popover that lists
 * only the items the caller passes — relevance to the current view is the
 * caller's decision.
 */

import { Checkbox, IconButton, Popover, RadioGroup } from "@buildcanada/components"

export type SettingsItem =
    | {
          kind: "toggle"
          id: string
          label: string
          value: boolean
          onChange: (value: boolean) => void
      }
    | {
          kind: "radio"
          id: string
          label: string
          options: { value: string; label: string }[]
          value: string
          onChange: (value: string) => void
      }

export interface SettingsMenuProps {
    items: SettingsItem[]
    /** Accessible label for the gear button. Default "Settings". */
    label?: string
}

export function SettingsMenu({ items, label = "Settings" }: SettingsMenuProps) {
    return (
        <Popover
            className="bcds2-settings"
            panelClassName="bcds2-settings__popover"
            panelRole="dialog"
            placement="bottom-end"
            trigger={
                <IconButton
                    className="bcds2-settings__button"
                    label={label}
                    variant="outline-charcoal"
                    size="sm"
                    icon={
                        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                            <circle cx="8" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
                            <path
                                d="M8 1v2.2M8 12.8V15M1 8h2.2M12.8 8H15M3.05 3.05l1.56 1.56M11.39 11.39l1.56 1.56M12.95 3.05l-1.56 1.56M4.61 11.39l-1.56 1.56"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                            />
                        </svg>
                    }
                />
            }
        >
            <div className="bcds2-settings__panel" aria-label={label}>
                {items.map((item) =>
                    item.kind === "toggle" ? (
                        <div key={item.id} className="bcds2-settings__item bcds2-settings__item--toggle">
                            <Checkbox
                                label={item.label}
                                checked={item.value}
                                onChange={(event) => item.onChange(event.target.checked)}
                            />
                        </div>
                    ) : (
                        <RadioGroup
                            key={item.id}
                            className="bcds2-settings__item bcds2-settings__item--radio"
                            legend={item.label}
                            name={`bcds2-settings-${item.id}`}
                            value={item.value}
                            onValueChange={item.onChange}
                            options={item.options}
                        />
                    ),
                )}
            </div>
        </Popover>
    )
}
