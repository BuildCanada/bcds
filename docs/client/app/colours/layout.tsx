import ColourSidebar from "./_components/ColourSidebar";
import ColourMenu from "./_components/ColourMenu";
import Nav from "@/components/Nav";
import DocsPattern from "@/components/patterns/DocsPatternRight";
import Footer from "@/components/Footer";

export default function GuideLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="m-[2ch] border-[1.5px] border-charcoal-900">
      <Nav />
      <div className="flex flex-col gap-4 px-8 py-6 md:h-fit min-h-fill md:overflow-y-hidden md:p-0 lg:gap-0 lg:grid lg:grid-cols-5">
        <ColourSidebar />
        <ColourMenu />
        <main className="flex-1 lg:col-start-2 lg:col-end-5 lg:border-l lg:border-r-[1.5px] md:border-x-charcoal-900">
          <article className="max-w-[80ch] prose prose-charcoal markdown p-[5ch]">
            {children}
          </article>
        </main>
        <ColourMenu />
        <DocsPattern />
      </div>
      <Footer />
    </div>
  );
}
