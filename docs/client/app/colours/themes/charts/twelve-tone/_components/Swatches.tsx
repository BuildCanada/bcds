import {
  auburn_cool_bend,
  linen_warm_bend,
  linen_auburn_blend,
  linen_aurora_blend,
  linen_lake_blend,
  linen_pine_blend,
  linen_cool_bend,
  pine_warm_bend,
  pine_lake_blend,
  pine_maritime_blend,
  pine_cool_bend,
  lake_warm_bend,
  lake_pine_blend,
  lake_maritime_blend,
  maritime_aurora_blend,
  maritime_pine_blend,
  aurora_auburn_blend,
  aurora_linen_blend,
  nickel_warm_bend,
  nickel_auburn_blend,
  nickel_cool_bend,
  steel_warm_bend,
  steel_pine_blend,
  steel_lake_blend,
  steel_cool_bend,
} from "@buildcanada/colours";
import Swatch from "@/app/colours/_components/Swatch";

function snakeToCapital(value: string) {
  const parts = value.split("_")!;
  return parts
    .map((part) => {
      return `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`;
    })
    .join(" ");
}

type SwatchRowArgs = {
  label: string;
  colors: string[];
};

function TwelveToneSwatchRow(args: SwatchRowArgs) {
  return (
    <div className="flex flex-col gap-1">
      <h4>{snakeToCapital(args.label)}</h4>
      <div className="grid grid-cols-12 items-center gap-2">
        {args.colors.map((color) => (
          <Swatch key={`${args.label}-${color}}`} color={color} />
        ))}
      </div>
      <pre>
        <code>{args.label}</code>
      </pre>
    </div>
  );
}

export default function TwelveToneSwatches() {
  return (
    <div className="flex flex-col gap-1">
      <TwelveToneSwatchRow label="auburn_cool_bend" colors={auburn_cool_bend} />
      <TwelveToneSwatchRow label="linen_warm_bend" colors={linen_warm_bend} />
      <TwelveToneSwatchRow
        label="linen_auburn_blend"
        colors={linen_auburn_blend}
      />
      <TwelveToneSwatchRow
        label="linen_aurora_blend"
        colors={linen_aurora_blend}
      />
      <TwelveToneSwatchRow label="linen_lake_blend" colors={linen_lake_blend} />
      <TwelveToneSwatchRow label="linen_pine_blend" colors={linen_pine_blend} />
      <TwelveToneSwatchRow label="linen_cool_bend" colors={linen_cool_bend} />
      <TwelveToneSwatchRow label="pine_warm_bend" colors={pine_warm_bend} />
      <TwelveToneSwatchRow label="pine_lake_blend" colors={pine_lake_blend} />
      <TwelveToneSwatchRow
        label="pine_maritime_blend"
        colors={pine_maritime_blend}
      />
      <TwelveToneSwatchRow label="pine_cool_bend" colors={pine_cool_bend} />
      <TwelveToneSwatchRow label="lake_warm_bend" colors={lake_warm_bend} />
      <TwelveToneSwatchRow label="lake_pine_blend" colors={lake_pine_blend} />
      <TwelveToneSwatchRow
        label="lake_maritime_blend"
        colors={lake_maritime_blend}
      />
      <TwelveToneSwatchRow
        label="maritime_aurora_blend"
        colors={maritime_aurora_blend}
      />
      <TwelveToneSwatchRow
        label="maritime_pine_blend"
        colors={maritime_pine_blend}
      />
      <TwelveToneSwatchRow
        label="aurora_auburn_blend"
        colors={aurora_auburn_blend}
      />
      <TwelveToneSwatchRow
        label="aurora_linen_blend"
        colors={aurora_linen_blend}
      />
      <TwelveToneSwatchRow label="nickel_warm_bend" colors={nickel_warm_bend} />
      <TwelveToneSwatchRow
        label="nickel_auburn_blend"
        colors={nickel_auburn_blend}
      />
      <TwelveToneSwatchRow label="nickel_cool_bend" colors={nickel_cool_bend} />
      <TwelveToneSwatchRow label="steel_warm_bend" colors={steel_warm_bend} />
      <TwelveToneSwatchRow
        label="nickel_auburn_blend"
        colors={nickel_auburn_blend}
      />
      <TwelveToneSwatchRow label="steel_pine_blend" colors={steel_pine_blend} />
      <TwelveToneSwatchRow label="steel_lake_blend" colors={steel_lake_blend} />
      <TwelveToneSwatchRow label="steel_cool_bend" colors={steel_cool_bend} />
    </div>
  );
}
