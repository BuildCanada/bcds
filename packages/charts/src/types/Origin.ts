import { License } from "./Variable.js"
export interface Origin {
    id?: number
    title?: string
    titleSnapshot?: string
    attribution?: string
    attributionShort?: string
    versionProducer?: string
    license?: License
    descriptionSnapshot?: string
    description?: string
    producer?: string
    citationFull?: string
    urlMain?: string
    urlDownload?: string
    dateAccessed?: string
    datePublished?: string
}
