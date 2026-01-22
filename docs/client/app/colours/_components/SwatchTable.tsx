import "./colours.css";
import Swatch from "./Swatch";

type SwatchSet = {
  label: string;
  colours: Record<string, string>;
};

const basicStages = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

const charcoalStages = [
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1050,
];

function SwatchRow(args: { set: SwatchSet }) {
  return (
    <div className="grid grid-cols-15 items-center gap-2">
      <p className="col-start-1 col-end-4 pl-4">{args.set.label}</p>
      {basicStages.map((stage) => {
        const stageSet = `${stage}`;
        const swatch = args.set.colours[stageSet]! as string;
        return <Swatch key={`${args.set.label}-${stage}`} color={swatch} />;
      })}
    </div>
  );
}

function SwatchTableHeader() {
  return (
    <div className="grid grid-cols-15 items-center gap-1">
      <div className="col-start-1 col-end-4"></div>
      {basicStages.map((stage) => {
        return (
          <p key={`header-${stage}`} className="text-center">
            {stage}
          </p>
        );
      })}
    </div>
  );
}

export function SwatchTable(args: { sets: SwatchSet[] }) {
  return (
    <div className="grid grid-cols-1 bg-white/25 rounded-sm">
      <SwatchTableHeader />
      {args.sets.map((swatchSet, id) => {
        return (
          <SwatchRow key={`set-${swatchSet.label}-${id}`} set={swatchSet} />
        );
      })}
    </div>
  );
}

function CharcoalTableHeader() {
  return (
    <div className="grid grid-cols-15 items-center gap-1">
      <div className="col-start-1 col-end-4"></div>
      {charcoalStages.map((stage) => {
        return (
          <p key={`header-${stage}`} className="text-center">
            {stage}
          </p>
        );
      })}
    </div>
  );
}

function CharcoalRow(args: { set: SwatchSet }) {
  return (
    <div className="grid grid-cols-17 items-center gap-2">
      <p className="col-start-1 col-end-4 pl-4">{args.set.label}</p>
      {charcoalStages.map((stage) => {
        const stageSet = `${stage}`;
        const swatch = args.set.colours[stageSet]! as string;
        return <Swatch key={`${args.set.label}-${stage}`} color={swatch} />;
      })}
    </div>
  );
}

export function CharcoalTable(args: SwatchSet) {
  return (
    <div className="grid grid-cols-1 bg-white/25 rounded-sm">
      <CharcoalTableHeader />
      <CharcoalRow key={`set-${args.label}`} set={args} />
    </div>
  );
}
