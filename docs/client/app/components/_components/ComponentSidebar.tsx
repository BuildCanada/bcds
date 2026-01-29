import ComponentNav from "./ComponentNav";
import DocsPattern from "@/components/patterns/DocsPatternLeft";

export default function GuideSidebar() {
  return (
    <section className="hidden max-lg:-z-10 lg:grid relative prose prose-charcoal md:col-start-1 md:col-end-2 md:border-r md:border-r-charcoal-900">
      <ComponentNav />
      <DocsPattern />
    </section>
  );
}
