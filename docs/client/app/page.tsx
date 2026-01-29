import Nav from "@/components/Nav";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="flex flex-col w-full h-full max-w-svw overflow-x-clip">
      <div className="flex flex-col min-h-svh m-[2ch] border-[1.5px] border-charcoal-900">
        <Nav />
        <main className="flex flex-col flex-1 gap-2 w-full h-full">
          <div className="relative flex flex-row h-[33svh] w-full items-center justify-center">
            <Image
              fill={true}
              className="object-cover -z-10"
              src="/splash/hd.webp"
              alt="Stylized photo of a lake in the Canadian Rockies"
            />
            <div className="flex flex-col h-fit w-fit items-start justify-center p-4 border-[1.5px] border-charcoal-700 gap-4 bg-background">
              <h1 className="text-4xl">Build Canada Design System</h1>
              <h2 className="text-2xl">
                Coordinating Build Canada&apos;s digital initiatives
              </h2>
              <ButtonGroup>
                <Button variant="outline" asChild>
                  <Link href="/guides">Guides</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/components">Components</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/colours">Colours</Link>
                </Button>
              </ButtonGroup>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
