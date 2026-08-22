import Image from "next/image";
import logo from "@/references/logo.png";

const footerLinks = [
  {
    title: "Product",
    links: ["Features", "How it works", "Pricing", "Roadmap"],
  },
  {
    title: "Company",
    links: ["About Us", "Careers", "Contact", "Blog"],
  },
  {
    title: "Resources",
    links: ["Documentation", "Help Center", "Privacy", "Terms"],
  },
];

export default function Footer() {
  return (
    <footer className="w-full bg-agro-night px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <a href="#" className="flex items-center gap-2.5">
              <Image
                src={logo}
                alt="Agropioo logo"
                width={36}
                height={36}
                className="h-9 w-9"
              />
              <span className="text-lg font-bold text-white">Agropioo</span>
            </a>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-agro-cloud">
              AI-powered smart agriculture for Pakistan and the world. Soil and signal, together.
            </p>
            <p className="mt-4 text-xs text-agro-cloud">
              A product of{" "}
              <a
                href="http://aplinode.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-agro-sprout hover:text-white"
              >
                Aplinode
              </a>
            </p>
          </div>

          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4 className="text-sm font-semibold text-white">{group.title}</h4>
              <ul className="mt-4 space-y-2">
                {group.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-agro-cloud transition-colors hover:text-agro-sprout"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-agro-forest/50 pt-8 text-center">
          <p className="text-sm text-agro-cloud">
            © {new Date().getFullYear()} Agropioo. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
