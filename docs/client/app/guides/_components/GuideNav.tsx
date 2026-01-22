import { all_guides } from "@/data/all_guides";
import NavNode from "@/components/SidebarNavNode";

// --- Main Component ---
export default function GuideNav() {
  return (
    <div className="prose prose-charcoal flex flex-col">
      <div className="px-[2.5ch] pt-[1ch]">
        <h2>Documentation</h2>
      </div>
      <nav className="flex flex-col gap-2 py-[5ch] px-[2.5ch] pt-0 border-b-[1.5px] border-b-charcoal-700">
        {Object.entries(all_guides).map(([key, value]) => (
          <NavNode key={key} name={key} node={value} />
        ))}
      </nav>
    </div>
  );
}
