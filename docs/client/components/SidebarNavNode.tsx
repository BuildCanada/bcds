import Link from "next/link";
import { Fragment } from "react";
import z from "zod";

const kebabToTitle = (name: string) => {
  return name
    .split("-")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
};

export interface NavTree {
  __link?: string;
  [key: string]: NavTree | string | undefined;
}

const checkIsLink = (node: string | NavTree) => {
  const result = z.string().safeParse(node);
  if (result.success) return false;
  return true;
};

export default function NavNode({
  name,
  node,
  depth = 0,
}: {
  name: string;
  node: string | NavTree;
  depth?: number;
}) {
  // 1. TYPE GUARD: Ensure we are working with an Object (NavTree)
  // If 'node' is a string, it's a leaf/property we shouldn't be rendering directly here.
  if (typeof node !== "object") return null;

  // 2. DATA EXTRACTION
  const displayName = kebabToTitle(name);

  // "isPage" means: It is an object, AND it has a __link property
  const isPage = typeof node.__link === "string";
  const href = isPage ? `/${node.__link}` : "";

  // 3. STYLES
  const baseStyle = `block transition-colors`;
  const headerStyle = `text-lg font-bold text-charcoal-900`;
  const linkStyle = `text-charcoal-500 hover:text-charcoal-900`;
  const labelStyle = `text-charcoal-400 font-bold uppercase tracking-wider text-xs mt-4 mb-1`;

  // 4. RENDER LOGIC
  let NodeContent;

  if (isPage) {
    // --- IT IS A CLICKABLE PAGE ---
    // Distinguish between top-level pages (larger) and nested pages
    const specificStyle = depth === 0 ? headerStyle : linkStyle;

    NodeContent = (
      <Link
        href={href}
        className={`${baseStyle} ${specificStyle} decoration-none`}
      >
        {displayName}
      </Link>
    );
  } else {
    // --- IT IS JUST A FOLDER/LABEL ---
    if (depth === 0) {
      NodeContent = <h3 className={headerStyle}>{displayName}</h3>;
    } else {
      NodeContent = <div className={labelStyle}>{displayName}</div>;
    }
  }

  // 5. RECURSION
  // Filter out '__link' so we don't try to render the url string as a child node
  const childKeys = Object.keys(node).filter((k) => k !== "__link");

  return (
    <Fragment>
      {/* Render the current node (Link or Label) */}
      <div className="py-0.5">{NodeContent}</div>
      {/* Render children if any exist */}
      {childKeys.length > 0 && (
        <div
          className={`flex flex-col gap-1 ${depth > 0 ? "pl-4 border-l border-charcoal-200 ml-1" : ""}`}
        >
          {childKeys.map((childKey) => {
            const childNode = node[childKey];
            // Safety check: ensure the child is actually a NavTree before passing
            if (typeof childNode !== "object") return null;
            return (
              <NavNode
                key={childKey}
                name={childKey}
                node={childNode}
                depth={depth + 1}
              />
            );
          })}
        </div>
      )}
    </Fragment>
  );
}
