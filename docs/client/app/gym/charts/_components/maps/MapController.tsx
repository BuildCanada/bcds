import { Topology } from "topojson-specification";
import * as Federal from "../../_data/maps/canada-provinces.json";
import * as Alberta from "../../_data/maps/provinces/ab.json";
import VisxMercator from "./visx_map";

export default function MapController() {
  console.log();
  return (
    <div className="grid place-items-center">
      <VisxMercator width={480} height={480} />
    </div>
  );
}
