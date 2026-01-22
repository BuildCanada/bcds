import { amethyst, cerulean, emerald, sienna } from "@buildcanada/colours";
import { SwatchTable } from "./SwatchTable";

export default function VibrantSwatches() {
  return (
    <SwatchTable
      sets={[
        { label: "Amethyst", colours: amethyst },
        { label: "Cerulean", colours: cerulean },
        { label: "Emerald", colours: emerald },
        { label: "Sienna", colours: sienna },
      ]}
    />
  );
}
