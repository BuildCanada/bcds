"use client";

import { SequentialBars } from "./bar";
import { useState } from "react";
import { sequential } from "../_data/charts/sequential";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";

export default function SequentialBarController() {
  const [idx, setIdx] = useState(0);
  const sequentialValues = Object.values(sequential);
  const sequentialKeys = Object.keys(sequential);
  const incrementPalette = () => {
    if (idx + 1 >= sequentialValues.length - 1) {
      setIdx(0);
    } else {
      setIdx(idx + 1);
    }
  };
  const decrementPalette = () => {
    if (idx - 1 < 0) {
      setIdx(sequentialValues.length - 1);
    } else {
      setIdx(idx - 1);
    }
  };

  return (
    <>
      <h3>Current Palette: {sequentialKeys[idx]}</h3>
      <ButtonGroup>
        <Button onClick={() => decrementPalette()} variant="outline">
          Previous
        </Button>
        <Button onClick={() => incrementPalette()} variant="outline">
          Next
        </Button>
      </ButtonGroup>
      <SequentialBars paletteIdx={idx} />
    </>
  );
}
