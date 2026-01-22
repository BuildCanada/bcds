import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Swatch(args: { color: string }) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <div
          className="rounded-sm min-w-4 min-h-4 aspect-square"
          style={{ backgroundColor: args.color }}
        />
      </TooltipTrigger>
      <TooltipContent>{args.color}</TooltipContent>
    </Tooltip>
  );
}
