import BarController from "./_components/BarController";
import MapController from "./_components/maps/MapController";

export default function ChartGym() {
  return (
    <div className="flex h-svh w-svw overflow-clip items-center justify-center">
      <div className="flex flex-col items-center justify-center">
        <div className="bg-white p-4">
          {/*<BarController />*/}
          <MapController />
        </div>
      </div>
    </div>
  );
}
