"use client";

import DivergingBarController from "./DivergingBarController";
import SequentialBarController from "./SequentialBarController";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";

type ViewOptions = "divergent_bar" | "sequential_bar";

export default function BarController() {
  const [view, setView] = useState<ViewOptions>("divergent_bar");

  return (
    <>
      <h2>Current View: {view}</h2>
      <ButtonGroup>
        <Button onClick={() => setView("divergent_bar")} variant="outline">
          Divergent Bar
        </Button>
        <Button onClick={() => setView("sequential_bar")} variant="outline">
          Sequential Bar
        </Button>
      </ButtonGroup>
      {view == "divergent_bar" && <DivergingBarController />}
      {view == "sequential_bar" && <SequentialBarController />}
    </>
  );
}
