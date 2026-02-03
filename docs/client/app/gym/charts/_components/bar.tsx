import React, { useMemo } from "react";
import { Bar } from "@visx/shape";
import { Group } from "@visx/group";
import { scaleBand, scaleLinear } from "@visx/scale";

import { BaseChartProps } from "./types";

// --- SHARED COMPONENTS ---

const BaseBarChart = ({
  data,
  palette,
  width = 400,
  height = 300,
}: {
  data: { category: string; value: number }[];
  palette: string[];
  width?: number;
  height?: number;
}) => {
  const xMax = width;
  const yMax = height;

  const xScale = useMemo(
    () =>
      scaleBand({
        range: [0, xMax],
        domain: data.map((d) => d.category),
        padding: 0.2,
      }),
    [xMax, data],
  );

  const yScale = useMemo(
    () =>
      scaleLinear({
        range: [yMax, 0],
        domain: [0, 100],
      }),
    [yMax],
  );

  return (
    <svg width={width} height={height}>
      <Group>
        {data.map((d, i) => {
          const barHeight = yMax - yScale(d.value);
          // Safety fallback to grey if palette runs out
          const barColor = palette[i] || "#cccccc";

          return (
            <Bar
              key={d.category}
              x={xScale(d.category)}
              y={yMax - barHeight}
              width={xScale.bandwidth()}
              height={barHeight}
              fill={barColor}
            />
          );
        })}
      </Group>
    </svg>
  );
};

// --- EXPORTED CHART WRAPPERS ---

export const DivergingBars = ({
  count = 9,
  paletteIdx,
  simulationMode,
  ...dims
}: BaseChartProps) => {
  const data = useMemo(() => getData(count), [count]);
  const palette = useMemo(
    () => getSimulatedPalette(diverging, paletteIdx, count, simulationMode),
    [paletteIdx, count, simulationMode],
  );

  return <BaseBarChart data={data} palette={palette} {...dims} />;
};

export const SequentialBars = ({
  count = 9,
  paletteIdx,
  simulationMode,
  ...dims
}: BaseChartProps) => {
  const data = useMemo(() => getData(count), [count]);
  const palette = useMemo(
    () => getSimulatedPalette(sequential, paletteIdx, count, simulationMode),
    [paletteIdx, count, simulationMode],
  );

  return <BaseBarChart data={data} palette={palette} {...dims} />;
};
