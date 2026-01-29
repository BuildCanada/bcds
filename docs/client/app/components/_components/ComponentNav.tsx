import { all_components } from "@/data/all_components";
import NavNode from "@/components/SidebarNavNode";

// --- Main Component ---
export default function ComponentNav() {
  return (
    <div className="max-md:-z-10 prose prose-charcoal flex-col">
      <div className="px-[2.5ch] pt-[1ch]">
        <h2>Documentation</h2>
      </div>
      <nav className="flex flex-col gap-1 py-[5ch] px-[2.5ch] pt-0">
        {Object.entries(all_components).map(([key, value]) => (
          <NavNode key={key} name={key} node={value} />
        ))}
      </nav>
    </div>
  );
}
