export default function GuideLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="px-8 py-6">
      <article className="max-w-[70ch] prose markdown">{children}</article>
    </main>
  );
}
