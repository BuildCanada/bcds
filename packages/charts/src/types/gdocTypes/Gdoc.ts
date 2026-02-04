/**
 * Stub types for Google Docs integration.
 * These are simplified versions of the full gdocTypes.
 * Most Google Docs CMS functionality is not needed for the standalone charts library,
 * but the types are required for compilation.
 */

import { QueryParams } from "../domainTypes/Various.js"
import { ArchivedPageVersion } from "../domainTypes/Archive.js"

/**
 * Document types in the CMS.
 */
export enum GdocType {
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
export interface GdocBaseInterface {
    id: string
    slug: string
    content: GdocContent
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
export interface GdocContent {
    type: GdocType
    title?: string
    body?: EnrichedGdocBlock[]
    [key: string]: unknown
}

/**
 * Generic Gdoc interface.
 */
export type Gdoc =
    | GdocPostInterface
    | GdocDataInsightInterface
    | GdocAuthorInterface
    | GdocAboutInterface
    | GdocHomepageInterface

/**
 * JSON representation of a Gdoc.
 */
export interface GdocJSON {
    id: string
    slug: string
    content: GdocContent
    published: boolean
    createdAt: string
    publishedAt: string | null
    updatedAt: string | null
    [key: string]: unknown
}

/**
 * Post (article/topic page) interface.
 */
export interface GdocPostInterface extends GdocBaseInterface {
    content: GdocPostContent
}

export interface GdocPostContent extends GdocContent {
    type:
        | GdocType.Article
        | GdocType.TopicPage
        | GdocType.LinearTopicPage
        | GdocType.Fragment
        | GdocType.AboutPage
}

/**
 * Data insight interface.
 */
export interface GdocDataInsightInterface extends GdocBaseInterface {
    content: GdocDataInsightContent
}

export interface GdocDataInsightContent extends GdocContent {
    type: GdocType.DataInsight
}

/**
 * Author interface.
 */
export interface GdocAuthorInterface extends GdocBaseInterface {
    content: GdocAuthorContent
}

export interface GdocAuthorContent extends GdocContent {
    type: GdocType.Author
}

/**
 * About page interface.
 */
export interface GdocAboutInterface extends GdocBaseInterface {
    content: GdocAboutContent
}

export interface GdocAboutContent extends GdocContent {
    type: GdocType.AboutPage
}

/**
 * Homepage interface.
 */
export interface GdocHomepageInterface extends GdocBaseInterface {
    content: GdocHomepageContent
}

export interface GdocHomepageContent extends GdocContent {
    type: GdocType.Homepage
}

// =====================================================
// Block and Span types (for content traversal)
// =====================================================

/**
 * Base interface for enriched Gdoc blocks.
 */
export interface EnrichedGdocBlock {
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
export interface EnrichedBlockKeyInsightsSlide extends EnrichedGdocBlock {
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
