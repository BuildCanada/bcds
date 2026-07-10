export type SvgAttrs = Record<string, string | number | boolean | undefined>

export interface SvgNode {
    tag: string
    attrs?: SvgAttrs
    children?: Array<SvgNode | string>
}

export const node = (
    tag: string,
    attrs: SvgAttrs = {},
    children: Array<SvgNode | string> = []
): SvgNode => ({ tag, attrs, children })

export const textNode = (
    x: number,
    y: number,
    text: string,
    attrs: SvgAttrs = {}
): SvgNode => node("text", { x, y, ...attrs }, [text])

export const renderSvgNode = (svgNode: SvgNode): string => {
    const attrs = Object.entries(svgNode.attrs ?? {})
        .filter(([, value]) => value !== undefined && value !== false)
        .map(([key, value]) => {
            const attrValue = value === true ? key : String(value)
            return `${escapeAttr(key)}="${escapeAttr(attrValue)}"`
        })
        .join(" ")
    const open = attrs ? `<${svgNode.tag} ${attrs}>` : `<${svgNode.tag}>`
    const children = (svgNode.children ?? [])
        .map((child) => (typeof child === "string" ? escapeText(child) : renderSvgNode(child)))
        .join("")
    return `${open}${children}</${svgNode.tag}>`
}

export const escapeText = (value: string): string =>
    value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")

export const escapeAttr = (value: string): string =>
    escapeText(value).replaceAll('"', "&quot;")
