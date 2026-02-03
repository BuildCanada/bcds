"use client";

import DivergingBarController from "./DivergingBarController";
import SequentialBarController from "./SequentialBarController";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { colorIssues } from "./utils";
import { type ColorIssues } from "./types";

type ViewOptions = "divergent_bar" | "sequential_bar";

export default function BarController() {
  const [view, setView] = useState<ViewOptions>("divergent_bar");
  const [simMode, setSimMode] = useState<ColorIssues>("default");
  const [count, setCount] = useState<number>(9);

  const increaseCount = () => {
    setCount((v) => {
      return Math.min(v + 1, 9);
    });
  };

  const decreaseCount = () => {
    setCount((v) => {
      return Math.max(v - 1, 3);
    });
  };
  return (
    <>
      <h2 className="py-3">Current View: {view}</h2>
      <ButtonGroup>
        <Button onClick={() => setView("divergent_bar")} variant="outline">
          Divergent Bar
        </Button>
        <Button onClick={() => setView("sequential_bar")} variant="outline">
          Sequential Bar
        </Button>
      </ButtonGroup>
      {(view == "divergent_bar" || view == "sequential_bar") && (
        <>
          <h3 className="py-3">Count: {`${count}`}</h3>
          <ButtonGroup>
            <Button onClick={() => decreaseCount()} variant="outline">
              -
            </Button>
            <Button onClick={() => increaseCount()} variant="outline">
              +
            </Button>
          </ButtonGroup>
          {view == "divergent_bar" && (
            <DivergingBarController simulationMode={simMode} count={count} />
          )}
          {view == "sequential_bar" && (
            <SequentialBarController simulationMode={simMode} count={count} />
          )}
        </>
      )}
      <h2 className="py-3">Color Disability Sim: {simMode}</h2>
      <ButtonGroup>
        {colorIssues.map((issue) => {
          return (
            <Button
              key={`sim-${issue}`}
              onClick={() => setSimMode(issue)}
              variant="outline"
            >
              {issue}
            </Button>
          );
        })}
      </ButtonGroup>
    </>
  );
}
