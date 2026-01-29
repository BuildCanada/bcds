import ColourNav from "./ColourNav";
import DocsPattern from "@/components/patterns/DocsPatternLeft";

export default function ColourSidebar() {
  return (
    <section className="hidden -z-10 lg:grid relative prose prose-charcoal md:col-start-1 md:col-end-2 md:border-r md:border-r-charcoal-900">
      <ColourNav />
      <DocsPattern />
    </section>
  );
}
