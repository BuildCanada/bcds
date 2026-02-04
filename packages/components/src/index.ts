/*******************************************************************************
 * @buildcanada/components
 *
 * Build Canada Design System Components
 ******************************************************************************/

// Primitives
export { Button, type ButtonProps, type ButtonVariant, type ButtonSize } from "./primitives/Button/index.js"
export { TextField, type TextFieldProps, type TextFieldType } from "./primitives/TextField/index.js"
export { Checkbox, type CheckboxProps } from "./primitives/Checkbox/index.js"

// Layout
export { Container, type ContainerProps, type ContainerSize } from "./layout/Container/index.js"
export { Section, type SectionProps, type SectionBackground, type SectionSpacing } from "./layout/Section/index.js"
export { Grid, GridItem, type GridProps, type GridItemProps, type GridColumns, type GridGap } from "./layout/Grid/index.js"
export { Stack, type StackProps, type StackDirection, type StackSpacing, type StackAlign, type StackJustify } from "./layout/Stack/index.js"
export { Divider, type DividerProps, type DividerOrientation, type DividerVariant } from "./layout/Divider/index.js"

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
} from "./content/Card/index.js"
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
} from "./content/Hero/index.js"
export { StatBlock, type StatBlockProps, type StatBlockSize, type StatBlockTrend } from "./content/StatBlock/index.js"

// Navigation
export { Header, type HeaderProps, type NavItem } from "./navigation/Header/index.js"
export { Footer, type FooterProps, type FooterLink, type SocialLink } from "./navigation/Footer/index.js"

// Feedback
export { Dialog, type DialogProps, type DialogPosition } from "./feedback/Dialog/index.js"
export { PopupForm, type PopupFormProps } from "./feedback/PopupForm/index.js"
