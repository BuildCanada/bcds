import React from "react";
import { Bar, LinePath } from "@visx/shape";
import { Group } from "@visx/group";
import { scaleBand, scaleLinear } from "@visx/scale";
import { charts } from "../_data/charts/sequential/linen-pine";
import { diverging } from "../_data/charts/diverging";
import { sequential } from "../_data/charts/sequential";

// --- DUMMY DATA ---
// const data = [
//   { category: "A", value: 25 },
//   { category: "B", value: 45 },
//   { category: "C", value: 85 },
//   { category: "D", value: 65 },
//   { category: "E", value: 95 },
//   { category: "F", value: 95 },
//   { category: "G", value: 95 },
//   { category: "H", value: 95 },
//   { category: "I", value: 95 },
// ];

const randomAmount = () => {
  return Math.floor((Math.random() + 0.05) * 100);
};

const getData = () => {
  return [
    { category: "A", value: randomAmount() },
    { category: "B", value: randomAmount() },
    { category: "C", value: randomAmount() },
    { category: "D", value: randomAmount() },
    { category: "E", value: randomAmount() },
    { category: "F", value: randomAmount() },
    { category: "G", value: randomAmount() },
    { category: "H", value: randomAmount() },
    { category: "I", value: randomAmount() },
  ];
};

const steps = 9;
const palette = charts[steps]; // Grab the 5-step generated palette

const getDivergingPalette = (chartIdx: number) => {
  const values = Object.values(diverging);
  if (values[chartIdx]) return values[chartIdx][steps];
};

// --- 1. BAR CHART (Sequential Stress Test) ---
export const DivergingBars = (args: {
  width?: number;
  height?: number;
  paletteIdx: number;
}) => {
  let width = 400;
  if (args.width) {
    width = args.width;
  }
  let height = 300;
  if (args.height) {
    height = args.height;
  }

  const data = getData();

  const xScale = scaleBand({
    range: [0, width],
    domain: data.map((d) => d.category),
    padding: 0.2,
  });
  const yScale = scaleLinear({
    range: [height, 0],
    domain: [0, 100],
  });

  const palette = getDivergingPalette(args.paletteIdx);
  return (
    <svg width={width} height={height}>
      <Group>
        {data.map((d, i) => (
          <Bar
            key={d.category}
            x={xScale(d.category)}
            y={yScale(d.value)}
            width={xScale.bandwidth()}
            height={height - yScale(d.value)}
            fill={palette![i]} // Testing step-to-step contrast
          />
        ))}
      </Group>
    </svg>
  );
};

const getSequentialPalette = (chartIdx: number) => {
  const values = Object.values(sequential);
  if (values[chartIdx]) return values[chartIdx][steps];
};

export const SequentialBars = (args: {
  width?: number;
  height?: number;
  paletteIdx: number;
}) => {
  let width = 400;
  if (args.width) {
    width = args.width;
  }
  let height = 300;
  if (args.height) {
    height = args.height;
  }

  const data = getData();

  const xScale = scaleBand({
    range: [0, width],
    domain: data.map((d) => d.category),
    padding: 0.2,
  });
  const yScale = scaleLinear({
    range: [height, 0],
    domain: [0, 100],
  });

  const palette = getSequentialPalette(args.paletteIdx);
  return (
    <svg width={width} height={height}>
      <Group>
        {data.map((d, i) => (
          <Bar
            key={d.category}
            x={xScale(d.category)}
            y={yScale(d.value)}
            width={xScale.bandwidth()}
            height={height - yScale(d.value)}
            fill={palette![i]} // Testing step-to-step contrast
          />
        ))}
      </Group>
    </svg>
  );
};

// --- 2. MULTI-LINE CHART (Distinguishability Test) ---
export const QualitativeLines = ({ width = 400, height = 300 }) => {
  // Imagine these are 3 different "series"
  const series = [
    [10, 40, 30, 70, 50],
    [20, 60, 45, 90, 80],
    [5, 15, 25, 35, 45],
  ];

  const xScale = scaleLinear({ range: [0, width], domain: [0, 4] });
  const yScale = scaleLinear({ range: [height, 0], domain: [0, 100] });

  return (
    <svg width={width} height={height}>
      {series.map((points, i) => (
        <LinePath
          key={i}
          data={points}
          x={(_, index) => xScale(index)}
          y={(d) => yScale(d)}
          stroke={palette[i * 2]} // Skip steps to test high-contrast gaps
          strokeWidth={3}
          curve={undefined}
        />
      ))}
    </svg>
  );
};
