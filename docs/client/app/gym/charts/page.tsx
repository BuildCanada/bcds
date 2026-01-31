import { SequentialBars, QualitativeLines } from "./_components/bar";
import BarController from "./_components/BarController";
export default function ChartGym() {
  return (
    <div className="flex h-svh w-svw overflow-clip items-center justify-center">
      <div className="flex flex-col items-center justify-center">
        <div className="bg-white p-4">
          <BarController />
        </div>
      </div>
    </div>
  );
}
