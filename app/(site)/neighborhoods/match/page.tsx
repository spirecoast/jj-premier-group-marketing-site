import type { Metadata, Route } from "next";
import Link from "next/link";
import { FaqAccordion } from "@/components/faq-accordion";
import { JsonLd } from "@/components/json-ld";
import { Masthead } from "@/components/masthead";
import { AtlasMatch } from "@/components/match/atlas-match";
import { DATASET_VERSION, getIndexEntries } from "@/lib/neighborhoods/data";
import { monthYear } from "@/lib/neighborhoods/format";
import { parseMatch } from "@/lib/neighborhoods/match";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const count = (await getIndexEntries()).length;
  return pageMetadata({
    title: "Atlas Match: find the neighborhoods that fit",
    description: `Tell Atlas Match what you want: the area, the kind of home, a gate or not, an HOA or not, the water, how far from the storm surge and how close to work. It narrows ${count.toLocaleString()} neighborhoods in Lakewood Ranch, Sarasota and Bradenton to the ones that fit.`,
    path: "/neighborhoods/match",
    fileImage: true, // opengraph-image.tsx beside this page
  });
}

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * Atlas Match. Each question checks one sourced fact about a neighborhood and
 * the answer is an unranked list. The questions run client-side so the count
 * moves as answers change.
 */
export default async function MatchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const initial = parseMatch(params);
  const count = (await getIndexEntries()).length;
  const asOf = monthYear(DATASET_VERSION) ?? DATASET_VERSION;
  const how = [
    `Each answer checks one fact about each neighborhood: its county, its homes, whether it’s gated, whether it has an HOA or a CDD, its water and its evacuation zone. Those facts come from the county, the district, the association or the builder. The catalog was last updated ${asOf}.`,
    "When we don’t have a fact for a place, it shows as “not known yet”, and you decide whether those places stay in. The list isn’t ranked, so a place near the bottom fits as well as one at the top.",
    "The questions are about homes and places only. Nothing here asks about, or describes, who lives anywhere.",
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
        title="Find the neighborhoods that fit"
        titleId="match-title"
        titleClassName="max-w-[760px]"
        crumbs={
          <nav aria-label="Breadcrumb" className="t-mono-sm flex flex-wrap items-center gap-x-2 text-linen-200 text-shadow-soft">
            <Link href="/neighborhoods" className="underline-offset-4 hover:text-white hover:underline">
              Atlas
            </Link>
            <span aria-hidden="true">›</span>
            <span>Match</span>
          </nav>
        }
      >
        <p className="rise d3 t-lead max-w-[600px] text-linen-100 text-shadow-soft">
          Answer up to ten quick questions about the home and the place you want. Atlas Match narrows {count.toLocaleString()} neighborhoods to the
          ones that fit.
        </p>
      </Masthead>

      <section className="bg-parchment py-8 sm:py-section" aria-label="The questions">
        <div className="container-site">
          <AtlasMatch initial={initial} datasetVersion={DATASET_VERSION} asOf={asOf} />
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
