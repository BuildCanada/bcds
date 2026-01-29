import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { all_guides } from "@/data/all_guides";
import NavNode from "@/components/SidebarNavNode";

export default function GuideMenu() {
  return (
    <div className="flex flex-row p-4 z-10 lg:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">Guide Menu</Button>
        </SheetTrigger>
        <SheetContent side={"left"} showCloseButton={false}>
          <SheetHeader>
            <SheetTitle asChild>
              <h2 className="py-4 text-2xl">Documentation</h2>
            </SheetTitle>
            <nav className="flex flex-col gap-1 py-[5ch] pt-0">
              {Object.entries(all_guides).map(([key, value]) => (
                <NavNode key={key} name={key} node={value} />
              ))}
            </nav>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </div>
  );
}
