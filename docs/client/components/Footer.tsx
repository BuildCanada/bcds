import Link from "next/link";

const GithubLinks = () => {
  return (
    <div className="flex flex-col items-start w-fit">
      <h2 className="text-lg">Github Links:</h2>
      <Link
        href="https://github.com/BuildCanada/bcds"
        className="font-mono text-sm"
      >
        Main
      </Link>
      <Link
        href="https://github.com/BuildCanada/bcds/tree/master/packages/colours"
        className="font-mono text-sm"
      >
        Colours
      </Link>
      <Link
        href="https://github.com/BuildCanada/bcds/tree/master/packages/charts"
        className="font-mono text-sm"
      >
        Charts
      </Link>
      <Link
        href="https://github.com/BuildCanada/bcds/tree/master/packages/components"
        className="font-mono text-sm"
      >
        Components
      </Link>
    </div>
  );
};

type Contributor =
  | string
  | {
      href: string;
      label: string;
    };

const CONTRIBUTOR_LIST: Contributor[] = [
  {
    href: "https://mackenziebowes.com",
    label: "Mackenzie Bowes",
  },
];

const ContributorSingle = (args: { contributor: Contributor }) => {
  if (typeof args.contributor == "string")
    return <span className="font-mono text-sm">{args.contributor}</span>;
  return (
    <Link href={args.contributor.href} className="font-mono text-sm">
      {args.contributor.label}
    </Link>
  );
};

const Contributors = () => {
  return (
    <div className="flex flex-col">
      <h2 className="text-lg">Contributors:</h2>
      {CONTRIBUTOR_LIST.map((contributor, id) => {
        return (
          <ContributorSingle
            key={`contributor-${id}`}
            contributor={contributor}
          />
        );
      })}
    </div>
  );
};

const Copyright = () => {
  const yearString = new Date().getFullYear();
  return (
    <div className="grid place-items-center w-full p-2">
      <p className="text-linen-100 uppercase font-mono">
        🏗️🇨🇦 Copyright{" "}
        <Link href="https://www.buildcanada.com/">Build Canada</Link>{" "}
        {yearString}
      </p>
    </div>
  );
};

export default function Footer() {
  return (
    <div className="bg-charcoal-900 text-linen-100 flex flex-col p-4">
      <div className="flex flex-row items-start gap-8">
        <GithubLinks />
        <Contributors />
      </div>
      <Copyright />
    </div>
  );
}
