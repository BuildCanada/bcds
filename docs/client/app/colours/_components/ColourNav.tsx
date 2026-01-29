import { all_colours } from "@/data/all_colours";
import NavNode from "@/components/SidebarNavNode";

// --- Main Component ---
export default function ColourNav() {
  return (
    <div className="prose prose-charcoal flex flex-col">
      <div className="px-[2.5ch] pt-[1ch]">
        <h2>Documentation</h2>
      </div>
      <nav className="flex flex-col gap-1 py-[5ch] px-[2.5ch] pt-0">
        {Object.entries(all_colours).map(([key, value]) => (
          <NavNode key={key} name={key} node={value} />
        ))}
      </nav>
    </div>
  );
}
