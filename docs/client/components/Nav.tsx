import Link from "next/link";
import Wordmark from "./Wordmark";

export default function Nav() {
  return (
    <nav className="flex flex-row gap-0 p-0 border-b-[1.5px] border-charcoal-900">
      <Link
        href="/"
        className="bg-auburn-700 hover:bg-auburn-900 transition-colors px-[2ch] py-[2ch] border-r-[1.5px] border-charcoal-900"
      >
        <Wordmark />
      </Link>
    </nav>
  );
}
