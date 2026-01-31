"use client";

import { DivergingBars } from "./bar";
import { useState } from "react";
import { diverging } from "../_data/charts/diverging";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";

export default function DivergingBarController() {
  const [idx, setIdx] = useState(0);
  const divergingValues = Object.values(diverging);
  const divergingKeys = Object.keys(diverging);
  const incrementPalette = () => {
    if (idx + 1 >= divergingValues.length - 1) {
      setIdx(0);
    } else {
      setIdx(idx + 1);
    }
  };
  const decrementPalette = () => {
    if (idx - 1 < 0) {
      setIdx(divergingValues.length - 1);
    } else {
      setIdx(idx - 1);
    }
  };

  return (
    <>
      <h3>Current Palette: {divergingKeys[idx]}</h3>
      <ButtonGroup>
        <Button onClick={() => decrementPalette()} variant="outline">
          Previous
        </Button>
        <Button onClick={() => incrementPalette()} variant="outline">
          Next
        </Button>
      </ButtonGroup>
      <DivergingBars paletteIdx={idx} />
    </>
  );
}
