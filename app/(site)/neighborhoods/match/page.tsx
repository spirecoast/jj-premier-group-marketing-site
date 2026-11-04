import type { Metadata, Route } from "next";
import Link from "next/link";
import { FaqAccordion } from "@/components/faq-accordion";
import { JsonLd } from "@/components/json-ld";
import { Masthead } from "@/components/masthead";
import { AtlasMatchIsland } from "@/components/match/atlas-match";
import { DATASET_VERSION, getIndexEntries } from "@/lib/neighborhoods/data";
import { monthYear } from "@/lib/neighborhoods/format";
import { MATCH_DRAFT, MATCH_KEYS } from "@/lib/neighborhoods/match";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { IslandBoundary } from "@/components/ui/island-boundary";
import { UrlPending } from "@/components/url-pending";

export async function generateMetadata(): Promise<Metadata> {
  const count = (await getIndexEntries()).length;
  return pageMetadata({
    title: "Atlas Match: find the neighborhoods that fit",
    description: `Tell Atlas Match what you want: the area, the kind of home, a gate or not, an HOA or not, the water, how far from the storm surge and how close to work. It narrows ${count.toLocaleString()} neighborhoods in Lakewood Ranch, Sarasota and Bradenton to the ones that fit.`,
    path: "/neighborhoods/match",
    fileImage: true, // opengraph-image.tsx beside this page
  });
}

/**
 * Atlas Match. Each question checks one sourced fact about a neighborhood and
 * the answer is an unranked list. The questions run client-side so the count
 * moves as answers change. Static: a link's answers are applied in the browser.
 */
export default async function MatchPage() {
  const count = (await getIndexEntries()).length;
  const asOf = monthYear(DATASET_VERSION) ?? DATASET_VERSION;
  // The month the catalogue was generated (neighborhood-data/data/manifest.json), spelled out: "September 2026".
  const updated = monthYear(DATASET_VERSION, "long") ?? asOf;
  const how = [
    "For every neighborhood, we cover the county and the types of homes. We tell you if it’s gated and whether there’s an HOA or a CDD. We also note the water service and evacuation zone.",
    `All of this comes straight from the county or the community. The catalogue was last updated in ${updated}.`,
    "Fees and zones can change, so we always suggest double-checking before you buy.",
    "When we don’t have a fact for a place, it shows as “not known yet”, and you decide whether those places stay in. The list isn’t ranked, so a place near the bottom fits as well as one at the top.",
    "The questions are about homes and places only.",
  ].join("\n\n");

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Atlas", path: "/neighborhoods" },
          { name: "Match", path: "/neighborhoods/match" },
        ])}
      />

      <Masthead
        route="/neighborhoods/match"
        titleId="match-title"
      >
        <p className="rise d3 t-lead max-w-[600px] text-linen-100 text-shadow-soft">Find your neighborhood. We’ll narrow it down for you.</p>
      </Masthead>

      <section className="bg-parchment py-8 sm:py-section" aria-label="The questions">
        <div className="container-site">
          <UrlPending keys={MATCH_KEYS} draftKey={MATCH_DRAFT} />
          <IslandBoundary name="the questions" className="px-0 py-0">
            <AtlasMatchIsland datasetVersion={DATASET_VERSION} asOf={asOf} />
          </IslandBoundary>
        </div>
      </section>

      <section className="container-site flex flex-col gap-6 py-section">
        <FaqAccordion
          className="max-w-measure"
          items={[
            {
              q: "How Atlas Match works",
              answer: how,
              a: (
                <div className="flex flex-col gap-3">
                  {how.split("\n\n").map((para) => (
                    <p key={para.slice(0, 24)}>{para}</p>
                  ))}
                </div>
              ),
            },
          ]}
        />
        <Link href={"/neighborhoods" as Route} className="link-rule self-start">
          Back to the map
        </Link>
      </section>
    </>
  );
}
