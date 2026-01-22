import { linen, auburn, charcoal } from "@buildcanada/colours";
import { SwatchTable, CharcoalTable } from "./SwatchTable";

export default function CoreSwatches() {
  return (
    <>
      <SwatchTable
        sets={[
          { label: "Linen", colours: linen },
          { label: "Auburn", colours: auburn },
        ]}
      />
      <CharcoalTable label="Charcoal" colours={charcoal} />
    </>
  );
}
