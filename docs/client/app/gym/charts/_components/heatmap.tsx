import { useMemo } from "react";
import { Group } from "@visx/group";
import { scaleLinear } from "@visx/scale";
import { HeatmapRect } from "@visx/heatmap";
import { sequential } from "../_data/charts/sequential";
import { getSimulatedPalette } from "./utils"; // Assuming you kept the helpers
import { type BaseChartProps } from "./types";

// Generate a 10x10 grid of values
const getMatrixData = (size: number) => {
  return Array.from({ length: size }, (_, row) => ({
    bin: row,
    bins: Array.from({ length: size }, (_, col) => ({
      bin: col,
      count: Math.floor(Math.random() * 100), // Random intensity 0-100
    })),
  }));
};

export const SequentialMatrix = ({
  count = 10, // Grid size (10x10)
  paletteIdx,
  simulationMode,
  width = 400,
  height = 400,
}: BaseChartProps) => {
  const data = useMemo(() => getMatrixData(count), [count]);

  // Get full palette (mapped to 0-100 values)
  const palette = useMemo(
    () => getSimulatedPalette(sequential, paletteIdx, 9, simulationMode),
    [paletteIdx, simulationMode],
  );

  const xScale = scaleLinear({
    domain: Array.from({ length: count }, (_, i) => i),
    range: [0, width],
  });

  const yScale = scaleLinear({
    domain: Array.from({ length: count }, (_, i) => i),
    range: [height, 0],
  });

  // Helper to pick color bucket based on value (0-100)
  const colorScale = (value: number | { valueOf(): number }) => {
    if (typeof value == "number") {
      // Map 0-100 value to index 0-(palette.length-1)
      const index = Math.floor((value / 100) * (palette.length - 1));
      return palette[index];
    }
  };

  return (
    <svg width={width} height={height}>
      <Group>
        <HeatmapRect
          data={data}
          xScale={xScale}
          yScale={yScale}
          colorScale={colorScale}
          gap={2}
        >
          {(heatmap) =>
            heatmap.map((heatmapBins) =>
              heatmapBins.map((bin) => (
                <rect
                  key={`heatmap-rect-${bin.row}-${bin.column}`}
                  width={bin.width}
                  height={bin.height}
                  x={bin.x}
                  y={bin.y}
                  fill={bin.color} // This uses our sequential palette
                  rx={2} // Slight rounded corners look nicer
                />
              )),
            )
          }
        </HeatmapRect>
      </Group>
    </svg>
  );
};
