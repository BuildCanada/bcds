import React, { useMemo } from "react";
import { CustomProjection, Graticule } from "@visx/geo";
import type { Projection } from "@visx/geo/lib/types";
// import { geoConicConformal } from "d3-geo";
import { geoConicConformal } from "@visx/vendor/d3-geo";
import * as topojson from "topojson-client";
import { Topology } from "topojson-specification";

// --- TYPES ---
interface StatsCanFederalProperties {
  PRNAME: string;
  PRUID: string;
}

interface StatsCanProvincialProperties {
  CDNAME: string;
  PRNAME: string;
  CDUID: string;
}

interface StatsCanRegionProperties {
  PRUID: string;
  PRNAME: string;
  CDUID: string;
  CDNAME: string;
  CDTYPE: string;
  CSDUID: string;
  CSDNAME: string;
  CSDTYPE: string;
}

// StatsCan standard properties (based on your mapshaper output)
type StatsCanProperties =
  | StatsCanFederalProperties
  | StatsCanProvincialProperties
  | StatsCanRegionProperties;

interface PolygonGeometry {
  type: "Polygon";
  coordinates: number[][][]; // [Ring][Point]
}

interface MultiPolygonGeometry {
  type: "MultiPolygon";
  coordinates: number[][][][];
}

interface FeatureShape {
  type: "Feature";
  geometry: PolygonGeometry | MultiPolygonGeometry;
  properties: StatsCanProperties;
}

interface CanadaMapProps {
  width: number;
  height: number;
  data: Topology; // Generic Topology to accept any generated file
  events?: boolean;
  // Optional: Allow the parent to color shapes based on data (e.g., sequential palette)
  getFill?: (feature: FeatureShape) => string;
  onSelect?: (feature: FeatureShape) => void;
}

export const CanadaMap = ({
  width,
  height,
  data,
  events = false,
  getFill,
  onSelect,
}: CanadaMapProps) => {
  // 1. CONVERT TO GEOJSON (Dynamic Key)
  const world = useMemo<FeatureShape[]>(() => {
    if (!data) return [];

    // Auto-detect the primary layer key so we don't crash on "PROVINCE" vs "regions"
    const keys = Object.keys(data.objects);
    if (keys.length === 0) return [];
    const primaryLayer = keys[0]; // e.g., "provinces" or "lcsd000a25a_e"
    const topodata = topojson.feature(data, data.objects[primaryLayer]);

    // @ts-expect-error - topojson types are loose, but we know the structure
    const features = topodata.features as FeatureShape[];
    return features;
  }, [data]);

  // 2. DEFINE PROJECTION
  // geoConicConformal + fitSize is the "Magic Bullet" here.
  // It works for the whole country OR a single province drill-down automatically.
  const projection = useMemo(
    () =>
      geoConicConformal()
        .parallels([50, 70])
        .rotate([96, 0])
        .fitSize([width, height], {
          type: "FeatureCollection",
          features: world,
        }),
    [width, height, world],
  );
  console.dir({ projection });
  if (world.length === 0) return null;

  return (
    <svg width={width} height={height}>
      <CustomProjection<FeatureShape> projection={"mercator"} data={world}>
        {(customProjection) => {
          return (
            <g>
              {customProjection.features.map((feature, i) => {
                const { path, feature: f } = feature;
                // Use provided fill logic or default to StatsCan grey
                // const fillColor = getFill ? getFill(f) : "#EAEAEA";
                const fillColor = "#EAEAEA";

                return (
                  <path
                    key={`map-feature-${i}`}
                    d={path || ""}
                    fill={fillColor}
                    stroke="#FFFFFF"
                    strokeWidth={0.5}
                    // style={{
                    //   transition: "fill 0.2s ease",
                    //   cursor: events ? "pointer" : "default",
                    //   outline: "none", // Prevents focus ring issues on click
                    // }}
                    // onClick={() => {
                    //   if (events && onSelect) onSelect(f);
                    // }}
                    // onMouseEnter={(e) => {
                    //   if (events && !getFill)
                    //     e.currentTarget.style.fill = "#CFD8DC"; // Simple hover if no data color
                    // }}
                    // onMouseLeave={(e) => {
                    //   if (events && !getFill)
                    //     e.currentTarget.style.fill = fillColor;
                    // }}
                  />
                );
              })}
            </g>
          );
        }}
      </CustomProjection>
    </svg>
  );
};
