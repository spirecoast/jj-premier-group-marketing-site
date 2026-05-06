import Link from "next/link";

const exploreLinks = [
  { href: "/buy", label: "Buy" },
  { href: "/sell", label: "Sell" },
  { href: "/relocate", label: "Relocate" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface-elevated mt-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 grid md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <p className="font-display text-lg tracking-tight mb-3">
            [YOUR PLACEHOLDER]
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
            Real estate in Lakewood Ranch, Sarasota, and Manatee County, Florida.
          </p>
        </div>

        <div>
          <p className="text-eyebrow text-muted-foreground mb-3">Explore</p>
          <ul className="space-y-2 text-sm">
            {exploreLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-eyebrow text-muted-foreground mb-3">Compliance</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>FL Real Estate License # [PLACEHOLDER]</li>
            <li>Brokerage: [PLACEHOLDER BROKERAGE]</li>
            <li>Equal Housing Opportunity</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6 flex flex-col md:flex-row justify-between gap-3 text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} [YOUR PLACEHOLDER]. All rights reserved.
          </p>
          <p>Lakewood Ranch · Sarasota · Manatee County, FL</p>
        </div>
      </div>
    </footer>
  );
}
