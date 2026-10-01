/**
 * Every fact the relocation planner states, as data. The page, the ICS feed
 * and the print view all cite the same entry, so a figure or a date can only
 * change here. `checked` is the day the source was last opened.
 *
 * Nothing in the UI may carry a figure or a date that is not in this file or
 * computed from the visitor's answers. Where a source is secondary (a law
 * firm, a redlined draft), the entry says so and the copy hedges.
 */

export const SOURCES_CHECKED = "2026-10-01";

export type Source = {
  id: SourceId;
  label: string;
  url: string;
  checked: string;
  /** A note on the source's standing, carried into the copy as a hedge. */
  note?: string;
};

export type SourceId =
  | "dor-homestead"
  | "manatee-pao-homestead"
  | "dor-soh"
  | "fs-193-155"
  | "fs-193-155-3"
  | "fs-193-155-8"
  | "sarasota-pao-soh"
  | "flhsmv-new-resident"
  | "dos-voter-registration"
  | "fs-222-17"
  | "sarasota-clerk-domicile"
  | "manatee-clerk-recording"
  | "frbar-asis"
  | "nhc-season"
  | "citizens-binding"
  | "fs-689-302"
  | "fema-nfip-wait"
  | "cfo-flood-faq"
  | "dor-doc-stamps"
  | "barnes-walker-title"
  | "fs-117-ron"
  | "flysrq-nonstop";

const S = (id: SourceId, label: string, url: string, note?: string): Source => ({ id, label, url, checked: SOURCES_CHECKED, ...(note ? { note } : {}) });

export const SOURCES: Record<SourceId, Source> = {
  "dor-homestead": S("dor-homestead", "Florida Department of Revenue, PT-113 (homestead exemption)", "https://floridarevenue.com/property/Documents/pt113.pdf"),
  "manatee-pao-homestead": S("manatee-pao-homestead", "Manatee County Property Appraiser, exemptions and Save Our Homes", "https://www.manateepao.gov/definitions/exemptions-save-our-homes/"),
  "dor-soh": S("dor-soh", "Florida Department of Revenue, PT-112 (Save Our Homes and portability)", "https://floridarevenue.com/property/Documents/pt112.pdf"),
  "fs-193-155": S("fs-193-155", "Florida Statutes 193.155 (homestead assessments)", "https://www.flsenate.gov/Laws/Statutes/2024/193.155"),
  "fs-193-155-3": S("fs-193-155-3", "Florida Statutes 193.155(3) (reassessment at just value after a change of ownership)", "https://www.flsenate.gov/Laws/Statutes/2024/193.155"),
  "fs-193-155-8": S("fs-193-155-8", "Florida Statutes 193.155(8) (portability, the $500,000 cap)", "https://www.flsenate.gov/Laws/Statutes/2024/193.155"),
  "sarasota-pao-soh": S("sarasota-pao-soh", "Sarasota County Property Appraiser, Save Our Homes and portability", "https://www.sarasotapropertyappraiser.gov/exemptions/homestead/save-our-homesportability/"),
  "flhsmv-new-resident": S("flhsmv-new-resident", "FLHSMV, new Florida residents", "https://www.flhsmv.gov/new-resident/"),
  "dos-voter-registration": S("dos-voter-registration", "Florida Division of Elections, register to vote", "https://dos.fl.gov/elections/for-voters/voter-registration/register-to-vote-or-update-your-information/"),
  "fs-222-17": S("fs-222-17", "Florida Statutes 222.17 (declaration of domicile)", "https://www.flsenate.gov/Laws/Statutes/2024/222.17"),
  "sarasota-clerk-domicile": S("sarasota-clerk-domicile", "Sarasota County Clerk, declaration of domicile form", "https://www.sarasotaclerk.com/files/assets/clerk/v/3/documents/records/form-declaration-of-domicile.pdf"),
  "manatee-clerk-recording": S("manatee-clerk-recording", "Manatee County Clerk, recording questions", "https://www.manateeclerk.com/departments/recording/frequently-asked-questions/"),
  "frbar-asis": S(
    "frbar-asis",
    "Florida Realtors/Florida Bar AS IS contract (ASIS-7x), redline to Rev. 12/26",
    "https://www.floridarealtors.org/sites/default/files/2026-02/AS%20IS%20Residential%20Contract%20for%20Sale%20and%20Purchase%20(FloridaRealtors-FloridaBar-ASIS-7x)_Redlined[1].pdf",
    "A redlined copy of the current revision; the defaults below are what the form reads when a blank is left empty, and the contract you sign controls.",
  ),
  "nhc-season": S("nhc-season", "National Hurricane Center, season climatology", "https://www.nhc.noaa.gov/climo/"),
  "citizens-binding": S("citizens-binding", "Citizens Property Insurance, binding suspension notice", "https://www.citizensfla.com/-/20260719-citizens-is-under-binding-suspension", "Citizens' own rule. Private carriers are reported to follow similar rules; that part is not from a primary source."),
  "fs-689-302": S("fs-689-302", "Florida Statutes 689.302 (flood disclosure)", "https://www.flsenate.gov/Laws/Statutes/2024/689.302"),
  "fema-nfip-wait": S("fema-nfip-wait", "FEMA, waiting period for a flood policy", "https://www.fema.gov/fema-common-faq/waiting-period-activating-flood-policy"),
  "cfo-flood-faq": S("cfo-flood-faq", "Florida CFO, flood insurance questions", "https://www.myfloridacfo.com/division/consumers/storm/flood-disaster-faqs"),
  "dor-doc-stamps": S("dor-doc-stamps", "Florida Department of Revenue, documentary stamp tax", "https://floridarevenue.com/taxes/taxesfees/Pages/doc_stamp.aspx"),
  "barnes-walker-title": S("barnes-walker-title", "Barnes Walker, who pays for title insurance in Florida", "https://barneswalker.com/who-pays-for-title-insurance-in-florida/", "A law firm's summary of local custom, not a statute. Custom is negotiable and the contract controls."),
  "fs-117-ron": S("fs-117-ron", "Florida Statutes 117.201 to 117.305 (online notarization)", "https://www.flsenate.gov/Laws/Statutes/2024/117.201"),
  "flysrq-nonstop": S("flysrq-nonstop", "Sarasota Bradenton International Airport, nonstop destinations", "https://flysrq.com/nonstop-destinations"),
};

/**
 * The figures. Each one names the source it came from so the planner can
 * print the basis beside the date.
 */
export const FACTS = {
  contract: {
    /** Days after the Effective Date, when the blank is left empty. */
    inspectionDays: 15,
    loanApplicationDays: 5,
    loanApprovalDays: 30,
    floodElevationDays: 20,
    /** Days before Closing (paragraph 9(c)); 5 when paragraph 8(a), cash, is checked. */
    titleEvidenceDaysBeforeClosing: 15,
    titleEvidenceDaysBeforeClosingCash: 5,
    /** Standard G: time periods extend up to this many days after the event no longer prevents performance. */
    forceMajeureExtensionDays: 7,
    /** Standard G: either party may terminate if it runs this many days past the Closing Date. */
    forceMajeureTerminateDays: 30,
    source: "frbar-asis" as const,
  },
  /** Planning rules from the brief, not contract terms. Shown as "how we plan it". */
  planning: {
    financedContractDays: { min: 30, max: 45 },
    /** Thirty days gives the inspection, the insurance quote and the NFIP wait room; a shorter close is possible. */
    cashContractDays: { min: 14, max: 30 },
    bindBeforeClosingDays: 7,
    visitBeforeEffectiveDays: { min: 14, max: 42 },
    preapprovalBeforeVisitDays: 14,
    listHomeBeforeTargetDays: { min: 60, max: 90 },
    closingOffsetMax: 7,
  },
  hurricane: { startMonth: 6, startDay: 1, endMonth: 11, endDay: 30, source: "nhc-season" as const },
  nfip: { waitDays: 30, mapRevisionWaitDays: 1, mapRevisionMonths: 13, source: "fema-nfip-wait" as const, secondary: "cfo-flood-faq" as const },
  homestead: {
    /** Exempt from all property taxes, including school taxes. */
    exemptFirst: 25_000,
    /** A second exemption of up to this much, on assessed value in the band below, not applied to school taxes; adjusted for inflation since 2025. */
    additionalExemption: 25_000,
    additionalBand: { from: 50_000, to: 75_000 },
    additionalIndexedSince: 2025,
    fileByMonth: 3,
    fileByDay: 1,
    source: "dor-homestead" as const,
    countySource: "manatee-pao-homestead" as const,
  },
  saveOurHomes: { capPercent: 3, source: "dor-soh" as const, statute: "fs-193-155" as const, resetSource: "fs-193-155-3" as const, countySource: "sarasota-pao-soh" as const },
  portability: { years: 3, cap: 500_000, forms: "DR-501T with DR-501", source: "dor-soh" as const, capSource: "fs-193-155-8" as const },
  residency: { vehicleDays: 10, licenseDays: 30, consecutiveMonths: 6, source: "flhsmv-new-resident" as const },
  voter: { daysBeforeElection: 29, source: "dos-voter-registration" as const },
  floodDisclosure: { effective: "2024-10-01", source: "fs-689-302" as const },
  docStamps: { deedCentsPer100: 70, noteCentsPer100: 35, source: "dor-doc-stamps" as const },
} as const;

export type CountyKey = "sarasota" | "manatee";

export type CountyNote = {
  key: CountyKey;
  name: string;
  /** Who customarily pays for, and chooses, the owner's title policy. */
  titleCustom: string;
  titleSource: SourceId;
  clerk: { label: string; url: string; source: SourceId };
  pao: { label: string; url: string; source: SourceId };
};

export const COUNTIES: Record<CountyKey, CountyNote> = {
  sarasota: {
    key: "sarasota",
    name: "Sarasota County",
    titleCustom: "the buyer customarily pays for the owner's title policy and chooses the title agent",
    titleSource: "barnes-walker-title",
    clerk: { label: "Sarasota County Clerk", url: SOURCES["sarasota-clerk-domicile"].url, source: "sarasota-clerk-domicile" },
    pao: { label: "Sarasota County Property Appraiser", url: SOURCES["sarasota-pao-soh"].url, source: "sarasota-pao-soh" },
  },
  manatee: {
    key: "manatee",
    name: "Manatee County",
    titleCustom: "the seller customarily pays for the owner's title policy and chooses the title agent",
    titleSource: "barnes-walker-title",
    clerk: { label: "Manatee County Clerk", url: SOURCES["manatee-clerk-recording"].url, source: "manatee-clerk-recording" },
    pao: { label: "Manatee County Property Appraiser", url: SOURCES["manatee-pao-homestead"].url, source: "manatee-pao-homestead" },
  },
};

/** The source list in a fixed order, for the "Sources" footer of the plan and the print view. */
export const SOURCE_LIST: Source[] = Object.values(SOURCES);
