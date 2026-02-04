import * as React from "react"
import { computed, action, makeObservable } from "mobx"
import { observer } from "mobx-react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
    faShareNodes,
    faExpand,
    faCompress,
    faDownload,
    faArrowRight,
    IconDefinition,
    faHeart,
} from "@fortawesome/free-solid-svg-icons"
import {
    ShareMenu,
    ShareMenuManager,
    shareUsingShareApi,
    shouldShareUsingShareApi,
} from "./ShareMenu.tsx"
import { Tippy } from "../../utils/index.ts"
import classNames from "classnames"
import { GrapherModal } from "../core/GrapherConstants.ts"
import { DownloadModalTabName } from "../modal/DownloadModal.tsx"

export interface ActionButtonsManager extends ShareMenuManager {
    isAdmin?: boolean
    isShareMenuActive?: boolean
    hideShareButton?: boolean
    hideExploreTheDataButton?: boolean
    isInIFrame?: boolean
    canonicalUrl?: string
    isInFullScreenMode?: boolean
    activeModal?: GrapherModal
    activeDownloadModalTab?: DownloadModalTabName
    isOnTableTab?: boolean
    hideFullScreenButton?: boolean
}

// keep in sync with sass variables in ActionButtons.scss
const BUTTON_HEIGHT = 32

interface ActionButtonsProps {
    manager: ActionButtonsManager
}

@observer
export class ActionButtons extends React.Component<ActionButtonsProps> {
    constructor(props: ActionButtonsProps) {
        super(props)
        makeObservable(this)
    }

    @computed private get manager(): ActionButtonsManager {
        return this.props.manager
    }

    @computed get height(): number {
        return BUTTON_HEIGHT
    }

    @computed private get fullScreenButtonLabel(): string {
        const { isInFullScreenMode } = this.manager
        return isInFullScreenMode ? "Exit full-screen" : "Enter full-screen"
    }

    @action.bound toggleShareMenu(): void {
        if (shouldShareUsingShareApi(this.manager)) {
            void shareUsingShareApi(this.manager)
            return
        }
        this.manager.isShareMenuActive = !this.manager.isShareMenuActive
    }

    @action.bound toggleFullScreenMode(): void {
        this.manager.isInFullScreenMode = !this.manager.isInFullScreenMode
    }

    @action.bound openDownloadModal(): void {
        this.manager.activeModal = GrapherModal.Download

        // Open the Data tab when opening from the table view, otherwise open the Vis tab
        if (this.manager.isOnTableTab) {
            this.manager.activeDownloadModalTab = DownloadModalTabName.Data
        } else {
            this.manager.activeDownloadModalTab = DownloadModalTabName.Vis
        }
    }

    @computed private get hasDownloadButton(): boolean {
        return true
    }

    @computed private get hasDonateButton(): boolean {
        return !!this.manager.isInIFrame && !this.manager.isAdmin
    }

    @computed private get hasShareButton(): boolean {
        return (
            !this.manager.hideShareButton && ShareMenu.shouldShow(this.manager)
        )
    }

    @computed private get hasFullScreenButton(): boolean {
        return !this.manager.hideFullScreenButton && !this.manager.isInIFrame
    }

    @computed private get hasExploreTheDataButton(): boolean {
        const { manager } = this
        return !manager.hideExploreTheDataButton || !!manager.isInIFrame
    }

    private renderShareMenu(): React.ReactElement {
        return (
            <ShareMenu
                manager={this.manager}
                onDismiss={this.toggleShareMenu}
                right={0}
            />
        )
    }

    override render(): React.ReactElement {
        const { manager } = this
        const { isShareMenuActive } = manager

        return (
            <div className="ActionButtons">
                <ul>
                    {this.hasDownloadButton && (
                        <li>
                            <ActionButton
                                label="Download"
                                dataTrackNote="chart_click_download"
                                showLabel={true}
                                icon={faDownload}
                                onClick={action((e): void => {
                                    this.openDownloadModal()
                                    e.stopPropagation()
                                })}
                            />
                        </li>
                    )}
                    {this.hasShareButton && (
                        <li>
                            <ActionButton
                                label="Share"
                                dataTrackNote="chart_click_share"
                                showLabel={true}
                                icon={faShareNodes}
                                onClick={action((e): void => {
                                    this.toggleShareMenu()
                                    e.stopPropagation()
                                })}
                                isActive={this.manager.isShareMenuActive}
                            />
                            {isShareMenuActive && this.renderShareMenu()}
                        </li>
                    )}
                    {this.hasFullScreenButton && (
                        <li>
                            <ActionButton
                                label={this.fullScreenButtonLabel}
                                dataTrackNote="chart_click_fullscreen"
                                showLabel={true}
                                icon={
                                    manager.isInFullScreenMode
                                        ? faCompress
                                        : faExpand
                                }
                                onClick={this.toggleFullScreenMode}
                            />
                        </li>
                    )}
                    {this.hasDonateButton && (
                        <li>
                            <ActionButton
                                className="ActionButton--donate"
                                label="Donate"
                                dataTrackNote="chart_click_donate"
                                showLabel={true}
                                icon={faHeart}
                                href="https://ourworldindata.org/donate"
                            />
                        </li>
                    )}
                    {this.hasExploreTheDataButton && (
                        <li>
                            <ActionButton
                                label="Explore the data"
                                dataTrackNote="chart_click_exploredata"
                                icon={faArrowRight}
                                iconPlacement="right"
                                href={manager.canonicalUrl}
                                className="ActionButton--exploreData"
                                showLabel={true}
                            />
                        </li>
                    )}
                </ul>
            </div>
        )
    }
}

export function ActionButton(props: {
    label: string
    icon: IconDefinition
    iconPlacement?: "left" | "right"
    href?: string
    width?: number
    dataTrackNote?: string
    onClick?: React.MouseEventHandler<HTMLDivElement>
    onMouseDown?: React.MouseEventHandler<HTMLDivElement>
    showLabel?: boolean
    isActive?: boolean
    style?: React.CSSProperties
    className?: string
}): React.ReactElement {
    const buttonClassnames = classNames({
        active: props.isActive,
        "icon-only": !props.showLabel,
    })

    const iconPlacement = props.iconPlacement ?? "left"

    const buttonContents = (
        <>
            {iconPlacement === "left" && <FontAwesomeIcon icon={props.icon} />}
            {props.showLabel && <span className="label">{props.label}</span>}
            {iconPlacement === "right" && <FontAwesomeIcon icon={props.icon} />}
        </>
    )

    return (
        <Tippy
            content={props.label}
            theme="grapher-dark"
            placement="top"
            arrow={false}
            offset={[0, 4]}
            trigger="mouseenter"
            touch={false}
            disabled={props.showLabel}
        >
            <div
                className={classNames("ActionButton", props.className)}
                style={props.style}
                data-track-note={props.dataTrackNote}
                onClick={props.onClick}
                onMouseDown={props.onMouseDown}
            >
                {props.href ? (
                    <a
                        href={props.href}
                        className={buttonClassnames}
                        aria-label={props.label}
                        target="_blank"
                        rel="noopener"
                    >
                        {buttonContents}
                    </a>
                ) : (
                    <button
                        className={buttonClassnames}
                        aria-label={props.label}
                        type="button"
                    >
                        {buttonContents}
                    </button>
                )}
            </div>
        </Tippy>
    )
}
