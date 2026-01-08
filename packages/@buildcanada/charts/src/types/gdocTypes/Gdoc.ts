/**
 * Stub types for Google Docs integration.
 * These are simplified versions of the full OWID gdocTypes.
 * Most Google Docs CMS functionality is not needed for the standalone charts library,
 * but the types are required for compilation.
 */

import { QueryParams } from "../domainTypes/Various.js"
import { ArchivedPageVersion } from "../domainTypes/Archive.js"

/**
 * Document types in the OWID CMS.
 */
export enum OwidGdocType {
    Article = "article",
    TopicPage = "topic-page",
    LinearTopicPage = "linear-topic-page",
    DataInsight = "data-insight",
    Homepage = "homepage",
    AboutPage = "about-page",
    Author = "author",
    Fragment = "fragment",
    Announcement = "announcement",
    Profile = "profile",
}

/**
 * Information about a narrative chart embedded in content.
 */
export interface NarrativeChartInfo {
    name: string
    title: string
    chartConfigId: string
    parentChartSlug: string
    queryParamsForParentChart: QueryParams
    latestArchivedParent?: ArchivedPageVersion
}

/**
 * Detail on demand entry - used for interactive tooltips on terms.
 */
export interface EnrichedDetail {
    id: string
    text: string
}

/**
 * Dictionary mapping term IDs to their detail definitions.
 */
export type DetailDictionary = Record<string, EnrichedDetail>

// =====================================================
// Stub types for CMS integration
// These are minimal stubs for type compatibility.
// The actual CMS functionality is not used by the charts library.
// =====================================================

/**
 * User country information from geolocation.
 */
export interface UserCountryInformation {
    code: string
    name: string
    short_code_v2?: string
    continent?: string
    regions?: string[]
}

/**
 * Base interface for Gdoc content.
 */
export interface OwidGdocBaseInterface {
    id: string
    slug: string
    content: OwidGdocContent
    published: boolean
    createdAt: Date
    publishedAt: Date | null
    updatedAt: Date | null
    // Allow additional properties for CMS-specific fields
    contentMd5?: string
    breadcrumbs?: unknown
    manualBreadcrumbs?: unknown
    tags?: unknown[]
    linkedAuthors?: unknown[]
    linkedDocuments?: unknown[]
    linkedStaticViz?: unknown[]
    linkedCharts?: unknown[]
    linkedNarrativeCharts?: unknown[]
    linkedIndicators?: unknown[]
    imageMetadata?: unknown
    relatedCharts?: unknown[]
    donors?: unknown
    homepageMetadata?: unknown
    latestDataInsights?: unknown[]
    latestWorkLinks?: unknown[]
    [key: string]: unknown
}

/**
 * Gdoc content type.
 */
export interface OwidGdocContent {
    type: OwidGdocType
    title?: string
    body?: OwidEnrichedGdocBlock[]
    [key: string]: unknown
}

/**
 * Generic Gdoc interface.
 */
export type OwidGdoc =
    | OwidGdocPostInterface
    | OwidGdocDataInsightInterface
    | OwidGdocAuthorInterface
    | OwidGdocAboutInterface
    | OwidGdocHomepageInterface

/**
 * JSON representation of a Gdoc.
 */
export interface OwidGdocJSON {
    id: string
    slug: string
    content: OwidGdocContent
    published: boolean
    createdAt: string
    publishedAt: string | null
    updatedAt: string | null
    [key: string]: unknown
}

/**
 * Post (article/topic page) interface.
 */
export interface OwidGdocPostInterface extends OwidGdocBaseInterface {
    content: OwidGdocPostContent
}

export interface OwidGdocPostContent extends OwidGdocContent {
    type:
        | OwidGdocType.Article
        | OwidGdocType.TopicPage
        | OwidGdocType.LinearTopicPage
        | OwidGdocType.Fragment
        | OwidGdocType.AboutPage
}

/**
 * Data insight interface.
 */
export interface OwidGdocDataInsightInterface extends OwidGdocBaseInterface {
    content: OwidGdocDataInsightContent
}

export interface OwidGdocDataInsightContent extends OwidGdocContent {
    type: OwidGdocType.DataInsight
}

/**
 * Author interface.
 */
export interface OwidGdocAuthorInterface extends OwidGdocBaseInterface {
    content: OwidGdocAuthorContent
}

export interface OwidGdocAuthorContent extends OwidGdocContent {
    type: OwidGdocType.Author
}

/**
 * About page interface.
 */
export interface OwidGdocAboutInterface extends OwidGdocBaseInterface {
    content: OwidGdocAboutContent
}

export interface OwidGdocAboutContent extends OwidGdocContent {
    type: OwidGdocType.AboutPage
}

/**
 * Homepage interface.
 */
export interface OwidGdocHomepageInterface extends OwidGdocBaseInterface {
    content: OwidGdocHomepageContent
}

export interface OwidGdocHomepageContent extends OwidGdocContent {
    type: OwidGdocType.Homepage
}

// =====================================================
// Block and Span types (for content traversal)
// =====================================================

/**
 * Base interface for enriched Gdoc blocks.
 */
export interface OwidEnrichedGdocBlock {
    type: string
    parseErrors?: unknown[]
    [key: string]: unknown
}

/**
 * Base interface for spans (inline content).
 */
export interface Span {
    spanType: string
    children?: Span[]
    [key: string]: unknown
}

/**
 * Key insights slide block.
 */
export interface EnrichedBlockKeyInsightsSlide extends OwidEnrichedGdocBlock {
    type: "key-insights-slide"
    title?: string
    [key: string]: unknown
}

/**
 * Topic page intro related topic.
 */
export interface EnrichedTopicPageIntroRelatedTopic {
    text?: string
    url?: string
    [key: string]: unknown
}

/**
 * Topic page intro download button.
 */
export interface EnrichedTopicPageIntroDownloadButton {
    text?: string
    url?: string
    [key: string]: unknown
}

/**
 * Hybrid link (can be internal or external).
 */
export interface EnrichedHybridLink {
    url?: string
    text?: string
    [key: string]: unknown
}

// =====================================================
// TOC types
// =====================================================

/**
 * Table of contents heading with title and supertitle.
 */
export interface TocHeadingWithTitleSupertitle {
    text: string
    slug: string
    isSubheading?: boolean
    supertitle?: string
}

// =====================================================
// Data display types
// =====================================================

/**
 * Source information for display in data pages.
 */
export interface DisplaySource {
    label: string
    description?: string
    dataPublishedBy?: string
    retrievedOn?: string
    retrievedFrom?: string
    citation?: string
}
