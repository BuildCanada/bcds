/*******************************************************************************
 * @buildcanada/components
 *
 * Build Canada Design System Components
 ******************************************************************************/

// Primitives
export { Button, type ButtonProps, type ButtonVariant, type ButtonSize } from "./primitives/Button"
export { TextField, type TextFieldProps, type TextFieldType } from "./primitives/TextField"
export { Checkbox, type CheckboxProps } from "./primitives/Checkbox"

// Layout
export { Container, type ContainerProps, type ContainerSize } from "./layout/Container"
export { Section, type SectionProps, type SectionBackground, type SectionSpacing } from "./layout/Section"
export { Grid, GridItem, type GridProps, type GridItemProps, type GridColumns, type GridGap } from "./layout/Grid"
export { Stack, type StackProps, type StackDirection, type StackSpacing, type StackAlign, type StackJustify } from "./layout/Stack"
export { Divider, type DividerProps, type DividerOrientation, type DividerVariant } from "./layout/Divider"

// Content
export {
    Card,
    CardImage,
    CardIcon,
    CardContent,
    CardTitle,
    CardDescription,
    CardMeta,
    CardStat,
    CardAuthor,
    type CardProps,
    type CardVariant,
    type CardImageProps,
    type CardIconProps,
    type CardContentProps,
    type CardTitleProps,
    type CardDescriptionProps,
    type CardMetaProps,
    type CardStatProps,
    type CardAuthorProps,
} from "./content/Card"
export {
    Hero,
    HeroTitle,
    HeroSubtitle,
    HeroActions,
    type HeroProps,
    type HeroVariant,
    type HeroBackground,
    type HeroTitleProps,
    type HeroSubtitleProps,
    type HeroActionsProps,
} from "./content/Hero"
export { StatBlock, type StatBlockProps, type StatBlockSize, type StatBlockTrend } from "./content/StatBlock"

// Navigation
export { Header, type HeaderProps, type NavItem } from "./navigation/Header"
export { Footer, type FooterProps, type FooterLink, type SocialLink } from "./navigation/Footer"

// Feedback
export { Dialog, type DialogProps, type DialogPosition } from "./feedback/Dialog"
export { PopupForm, type PopupFormProps } from "./feedback/PopupForm"
