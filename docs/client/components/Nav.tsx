import Link from "next/link";
import Wordmark from "./Wordmark";

type NavLinkArgs = {
  href: string;
  label: string;
};

const NavLink = (args: NavLinkArgs) => {
  return (
    <Link
      href={args.href}
      className="h-full w-full not-last:border-r-[1.5px] border-charcoal-900 place-items-center grid hover:bg-linen-200/25"
    >
      <span>{args.label}</span>
    </Link>
  );
};

export default function Nav() {
  return (
    <>
      <nav className="flex flex-row gap-0 p-0 border-b-[1.5px] border-charcoal-900">
        <Link
          href="/"
          className="bg-auburn-700 hover:bg-auburn-900 transition-colors px-[2ch] py-[2ch] border-r-[1.5px] border-charcoal-900"
        >
          <Wordmark />
        </Link>
        <div className="grid grid-cols-3 place-items-center w-full">
          <NavLink href="/guides" label="Guides" />
          <NavLink href="/components" label="Components" />
          <NavLink href="/colours" label="Colours" />
        </div>
      </nav>
    </>
  );
}
