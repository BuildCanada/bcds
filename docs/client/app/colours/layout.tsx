import ColourSidebar from "./_components/ColourSidebar";
import Nav from "@/components/Nav";
import DocsPattern from "@/components/patterns/DocsPatternRight";
export default function GuideLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="m-[2ch] border-[1.5px] border-charcoal-900">
      <Nav />
      <div className="flex flex-col gap-4 px-8 py-6 md:h-fit min-h-fill md:overflow-y-hidden md:p-0 md:gap-0 md:grid md:grid-cols-5">
        <ColourSidebar />
        <main className="md:col-start-2 md:col-end-5 md:border-l md:border-r-[1.5px] md:border-x-charcoal-900">
          <article className="max-w-[80ch] prose prose-charcoal markdown p-[5ch]">
            {children}
          </article>
        </main>
        <DocsPattern />
      </div>
    </div>
  );
}
