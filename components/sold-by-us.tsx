import { ListingCard } from "@/components/listing-card";
import { SectionHeading } from "@/components/section-heading";
import { getRecentSolds } from "@/lib/content";
import { cn } from "@/lib/utils";

/**
 * "Sold by us": the team's most recent sales, each card carrying its date and
 * percent of list (components/listing-card.tsx). Read from the content layer,
 * so it is empty, and renders nothing, until the agents enter sold listings
 * in Studio; sample listings never reach production (lib/content/seed-source.ts).
 */
export async function SoldByUs({ limit = 3, className, tone = "paper" }: { limit?: number; className?: string; tone?: "paper" | "parchment" }) {
  const solds = await getRecentSolds(limit);
  if (!solds.length) return null;
  return (
    <section className={cn(tone === "parchment" ? "bg-parchment" : "bg-paper", className)} aria-labelledby="sold-by-us-title">
      <div className="container-site flex flex-col gap-10 py-section">
        <SectionHeading title={<span id="sold-by-us-title">Sold by us.</span>} />
        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {solds.map((l) => (
            <li key={l.slug} className="flex">
              <ListingCard listing={l} className="w-full" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
