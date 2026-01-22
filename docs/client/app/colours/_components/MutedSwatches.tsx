import {
  aurora,
  copper,
  pine,
  lake,
  maritime,
  nickel,
  steel,
} from "@buildcanada/colours";
import { SwatchTable } from "./SwatchTable";

export default function MutedSwatches() {
  return (
    <SwatchTable
      sets={[
        { label: "Aurora", colours: aurora },
        { label: "Copper", colours: copper },
        { label: "Pine", colours: pine },
        { label: "Lake", colours: lake },
        { label: "Maritime", colours: maritime },
        { label: "Nickel", colours: nickel },
        { label: "Steel", colours: steel },
      ]}
    />
  );
}
