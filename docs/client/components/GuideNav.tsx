import { all_docs } from "@/data/all_docs";
import Link from "next/link";

const kebabToTitle = (name: string) => {
  return name
    .split("-")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
};

export default function GuideNav() {
  return (
    <div className="prose prose-charcoal flex flex-col">
      <div className="px-[2.5ch] pt-[1ch]">
        <h2>Documentation</h2>
      </div>
      <nav className="flex flex-col gap-2 py-[5ch] px-[2.5ch] pt-0 border-b-[1.5px] border-b-charcoal-700">
        {all_docs.map((doc, idx) => {
          const label = kebabToTitle(doc.split("/").pop()!);
          return (
            <Link
              key={`${doc}-${idx}`}
              href={`/${doc}`}
              className=" hover:text-maritime-600 hover:visited:text-aurora-600"
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
