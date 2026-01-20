import GuideNav from "./GuideNav";
import DocsPattern from "./patterns/DocsPatternLeft";

export default function GuideSidebar() {
  return (
    <section className="relative prose prose-charcoal md:col-start-1 md:col-end-2 md:border-r md:border-r-charcoal-900">
      <GuideNav />
      <DocsPattern />
    </section>
  );
}
