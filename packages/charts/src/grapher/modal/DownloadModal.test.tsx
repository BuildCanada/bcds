/**
 * @vitest-environment jsdom
 *
 * Reproduces the "empty preview on initial open" bug in DownloadModalVisTab.
 *
 * Reported symptom: when the Download modal first mounts, the Image (PNG) and
 * Vector graphic (SVG) preview thumbnails are empty. Toggling any checkbox
 * (e.g. "Optimize SVG for Wikipedia upload") regenerates the preview correctly.
 *
 * Both the initial mount and the checkbox toggle call the same
 * DownloadModalVisTab#export() method, so any difference between them implies
 * that state-timing or initial inputs to rasterize differ on the first call.
 */

import { afterEach, expect, it, vi } from "vitest"
import { act, cleanup, render, waitFor } from "@testing-library/react"
import * as React from "react"

import { Bounds } from "../../utils/index.js"
import {
    DownloadModalManager,
    DownloadModalTabName,
    DownloadModalVisTab,
} from "./DownloadModal.js"
import { GrapherRasterizeFn } from "../captionedChart/StaticChartRasterizer.js"
import { LifeExpectancyGrapher } from "../testData/TestData.sample.js"

const PNG_URL =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkAAIAAAoAAv/lxKUAAAAASUVORK5CYII="
const SVG_BLOB_CONTENT =
    '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>'
const SVG_URL =
    "data:image/svg+xml;charset=utf-8;base64," + btoa(SVG_BLOB_CONTENT)

const makePngBlob = (): Blob =>
    new Blob([new Uint8Array([0])], { type: "image/png" })
const makeSvgBlob = (): Blob =>
    new Blob([SVG_BLOB_CONTENT], { type: "image/svg+xml" })

const makeRasterizeStub = (): GrapherRasterizeFn => {
    return vi.fn(async () => ({
        url: PNG_URL,
        blob: makePngBlob(),
        svgUrl: SVG_URL,
        svgBlob: makeSvgBlob(),
    }))
}

const makeStubManager = (
    overrides: Partial<DownloadModalManager> = {}
): DownloadModalManager => {
    return {
        displaySlug: "test-chart",
        rasterize: makeRasterizeStub(),
        staticBounds: new Bounds(0, 0, 850, 600),
        staticBoundsWithDetails: new Bounds(0, 0, 850, 600),
        captionedChartBounds: new Bounds(0, 0, 850, 600),
        frameBounds: new Bounds(0, 0, 850, 600),
        isOnChartOrMapTab: true,
        showAdminControls: true,
        baseUrl: "https://example.com/grapher/test",
        queryStr: "",
        activeDownloadModalTab: DownloadModalTabName.Vis,
        ...overrides,
    } as DownloadModalManager
}

afterEach(() => {
    cleanup()
})

// --- Sanity / control: with a stub rasterize that always resolves with a
// valid data URL, both the initial mount and a checkbox toggle paint an
// SVG <img>. This proves the modal's lifecycle works in principle.

it("stub rasterize: SVG preview is populated after initial mount", async () => {
    const manager = makeStubManager()
    const { container } = render(<DownloadModalVisTab manager={manager} />)

    await waitFor(
        () => {
            const previewImgs = container.querySelectorAll(
                ".download-modal__download-preview-img img"
            )
            expect(previewImgs.length).toBeGreaterThanOrEqual(2)
        },
        { timeout: 2000 }
    )

    expect(manager.rasterize).toHaveBeenCalledTimes(1)
    const srcs = Array.from(
        container.querySelectorAll(".download-modal__download-preview-img img")
    ).map((img) => img.getAttribute("src"))
    expect(srcs.every((s) => !!s && s.startsWith("data:"))).toBe(true)
})

it("stub rasterize: SVG preview is regenerated after toggling the Wikipedia checkbox (control)", async () => {
    const manager = makeStubManager()
    const { container } = render(<DownloadModalVisTab manager={manager} />)

    await waitFor(
        () => {
            expect(
                container.querySelector(".download-modal__download-preview-img")
            ).toBeTruthy()
        },
        { timeout: 2000 }
    )

    const checkboxes = Array.from(
        container.querySelectorAll("input[type=checkbox]")
    ) as HTMLInputElement[]
    const wikiCheckbox = checkboxes.find((cb) => {
        const label = cb.closest("label")?.textContent ?? ""
        return /Wikipedia/i.test(label)
    })
    expect(wikiCheckbox, "wikipedia checkbox should exist").toBeTruthy()

    await act(async () => {
        wikiCheckbox!.click()
    })

    await waitFor(
        () => {
            const previewImgs = container.querySelectorAll(
                ".download-modal__download-preview-img img"
            ) as NodeListOf<HTMLImageElement>
            expect(previewImgs.length).toBeGreaterThanOrEqual(2)
            const srcs = Array.from(previewImgs).map((img) =>
                img.getAttribute("src")
            )
            expect(srcs.every((s) => !!s && s.startsWith("data:"))).toBe(true)
        },
        { timeout: 2000 }
    )
})

// --- Failing test: drive the modal against a real GrapherState (the same
// `rasterize` implementation the app uses). This is the closest we can get
// to the real Chrome code path inside JSDOM. The test asserts the same thing
// the user expects: after the modal mounts, the preview images should be
// painted with non-empty data: URLs.

it(
    "real GrapherState: SVG preview is populated on initial mount (FAILS — reproduces bug)",
    async () => {
        const grapher = LifeExpectancyGrapher()
        const manager = grapher as unknown as DownloadModalManager

        const { container } = render(<DownloadModalVisTab manager={manager} />)

        // After the export pipeline finishes, the loading indicator should be
        // replaced by the preview area with both PNG and SVG <img>s.
        await waitFor(
            () => {
                expect(
                    container.querySelector(
                        ".download-modal__download-preview-img"
                    )
                ).toBeTruthy()
            },
            { timeout: 5000 }
        )

        const previewImgs = container.querySelectorAll(
            ".download-modal__download-preview-img img"
        ) as NodeListOf<HTMLImageElement>
        expect(previewImgs.length).toBe(2)
        const srcs = Array.from(previewImgs).map((img) =>
            img.getAttribute("src")
        )
        expect(srcs.every((s) => !!s && s.startsWith("data:"))).toBe(true)
    },
    10000
)
