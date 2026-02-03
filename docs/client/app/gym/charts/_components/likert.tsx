import React, { useMemo } from "react";
import { Group } from "@visx/group";
import { scaleLinear, scaleBand } from "@visx/scale";
import { diverging } from "../_data/charts/diverging";
import { getSimulatedPalette } from "./utils";
import { BaseChartProps } from "./types";

// Dummy survey questions
const QUESTIONS = ["Ease of Use", "Speed", "Reliability", "Support", "Price"];

// Generate fake Likert data (-2 to +2 scale distributed across 0-100%)
const getLikertData = () => {
  return QUESTIONS.map((q) => ({
    question: q,
    // Random distribution of 5 buckets (Strongly Disagree -> Strongly Agree)
    // We normalize them so the total width is consistent
    segments: [15, 20, 30, 20, 15].map((v) => v + (Math.random() * 10 - 5)),
  }));
};

export const DivergingLikert = ({
  paletteIdx,
  simulationMode,
  width = 500,
  height = 300,
}: BaseChartProps) => {
  const data = useMemo(() => getLikertData(), []);

  // We need a 5-step diverging palette for 5 Likert options
  const palette = useMemo(
    () => getSimulatedPalette(diverging, paletteIdx, 5, simulationMode),
    [paletteIdx, simulationMode],
  );

  const yScale = scaleBand({
    domain: data.map((d) => d.question),
    range: [0, height],
    padding: 0.4,
  });

  const xScale = scaleLinear({
    domain: [-100, 100], // Centered axis
    range: [0, width],
  });

  return (
    <svg width={width} height={height}>
      <Group left={width / 2}>
        {/* We shift the group to the center to make 0 the middle */}
        {data.map((row) => {
          let currentNegative = 0;
          let currentPositive = 0;
          const y = yScale(row.question);
          const barHeight = yScale.bandwidth();

          return (
            <Group key={row.question} top={y}>
              {row.segments.map((value, i) => {
                const isNegative = i < 2; // First 2 segments are negative
                const isNeutral = i === 2; // Middle is neutral
                const color = palette[i];

                // Calculate x-position based on diverging stack logic
                let x = 0;
                const barWidth = xScale(Math.abs(value)) - xScale(0);

                if (isNeutral) {
                  // Split neutral bar: half left, half right
                  x = -(barWidth / 2);
                } else if (isNegative) {
                  currentNegative += barWidth;
                  x = -currentNegative;
                } else {
                  // Positive
                  x = currentPositive;
                  currentPositive += barWidth;
                }

                return (
                  <rect
                    key={i}
                    x={x}
                    y={0}
                    width={barWidth}
                    height={barHeight}
                    fill={color}
                    stroke={"#fff"} // Adds a separator line
                    strokeWidth={1}
                  />
                );
              })}
              {/* Label */}
              <text
                x={-width / 2} // Align to far left
                y={barHeight / 2}
                dy=".32em"
                fontSize={12}
                fill="currentColor"
              >
                {row.question}
              </text>
            </Group>
          );
        })}
      </Group>
      {/* Center Line for reference */}
      <line
        x1={width / 2}
        x2={width / 2}
        y1={0}
        y2={height}
        stroke="#333"
        strokeDasharray="4"
        opacity={0.3}
      />
    </svg>
  );
};
