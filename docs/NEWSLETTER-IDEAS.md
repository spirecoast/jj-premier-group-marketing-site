# Newsletter ideas

Words the owners asked to take off the site, kept here word for word so they can go into a future
Tide letter. Each entry says where it was and when it came off. Any figure in them was right for
the page and the day it was on; check it again before it goes into a letter.

## Tide Market Report: "One move in …" (removed November 2026)

Each issue's market chapter (`/tide/<issue>`) ended with one sentence set apart under the label
"One move in {market}". Joelyn and Jessica asked for these to come off every issue, starting with
"If you're selling a resale home". The issues' figures are unchanged (they're frozen in
`lib/tide/snapshots`).

### October 2026 issue, July figures (`/tide/2026-10`)

- One move in Lakewood Ranch: "If you’re selling a resale home here, compare your price with the
  new homes nearby."
- One move in Sarasota: "If you’re buying here, compare prices with last year, because a square
  foot costs more now."
- One move in Bradenton: "If you’re buying here, start your search under $400K, where half of
  July’s homes sold."

### November 2026 issue, August figures (`/tide/2026-11`)

- One move in Lakewood Ranch: "If you’re selling here, set your price from what sold near you in
  the last few months."
- One move in Sarasota: "If you’re buying here and a house is out of reach, look at condos, villas
  and townhomes."
- One move in Bradenton: "If you’re buying here, compare homes by the price per square foot, which
  is lower than a year ago."

## Tide Sale Calculator (`/sell/net-proceeds`, removed November 2026)

### Under "3 Commission, as negotiated"

> What you offer a buyer’s broker, if anything, is a separate line and a separate decision.

### "Good to know"

**It isn't a closing statement.** The title company prepares that from the contract, the payoff
letters and the association's ledger, and their figures govern. This sheet is for deciding whether
and when, not for signing.

**Commissions aren't suggested here.** Both lines stay blank until you type a number. What you pay
the listing side and what you offer a buyer's broker, if anything, are negotiated and written into
the listing agreement before the house goes live.

**Customs aren't laws.** Who pays the owner's title policy is county habit, and the contract's
paragraph 9(c) can say otherwise. The sheet follows the custom until you tell it the contract did
something else.

**It's for Sarasota and Manatee.** Miami-Dade has a different documentary stamp rate and a surtax,
and Broward and Miami-Dade use a different title paragraph in the contract. Elsewhere in Florida
the stamp rate holds but the title custom may not.

### "Where each number comes from"

The calculator still uses these sources (`SOURCES` in `lib/net-proceeds.ts`), and each line on the
sheet still names its rule; only the list came off the page.

1. [Documentary Stamp Tax](https://floridarevenue.com/taxes/taxesfees/Pages/doc_stamp.aspx)  
   Florida Department of Revenue · checked 2026-10-01  
   Deeds: 70 cents on each $100 or portion thereof of the consideration. Miami-Dade is 60 cents plus a 45-cent surtax, so this sheet is for Sarasota and Manatee only.
2. [Rule 69O-186.003, Title Insurance Rates](https://www.law.cornell.edu/regulations/florida/Fla-Admin-Code-Ann-R-69O-186-003)  
   Florida Administrative Code (Cornell LII copy); rule named on the Florida CFO's title insurance overview · checked 2026-10-01  
   Original owner's policy: $5.75 per $1,000 to $100,000; $5.00 per $1,000 from $100,000 to $1,000,000; $2.50 to $5,000,000; $2.25 to $10,000,000; $2.00 above, considering any fraction of $100 as a full $100. Minimum premium $100.
   The rule is also named, with its first two tiers, on the [Florida CFO’s title insurance overview](https://www.myfloridacfo.com/division/consumers/understanding-insurance/title-insurance-overview).
3. [Who Pays for Title Insurance in Florida?](https://barneswalker.com/who-pays-for-title-insurance-in-florida/)  
   Barnes Walker, a Bradenton and Sarasota closing firm · checked 2026-10-01  
   Sarasota County: buyer pays for the owner's policy and chooses the title agent. Manatee County: seller pays and chooses. Customs, not laws; always negotiable in the contract (FR/BAR paragraph 9(c)).
4. [Estoppel Certificate Fees (adjusted amounts)](https://www2.myfloridalicense.com/lsc/documents/ESTOPPEL_CERTIFICATE_FEES.pdf)  
   Florida Department of Business and Professional Regulation · checked 2026-10-01  
   Preparation and delivery: not more than $299. Expedited (3 business days): an additional $119. Delinquent account: an additional fee not to exceed $179. Next update by July 1, 2027.
5. [F.S. 720.30851 (HOA) and F.S. 718.116(8) (condominium)](http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0700-0799/0720/Sections/0720.30851.html)  
   Florida Legislature · checked 2026-10-01  
   Sets the base caps ($250, $150 delinquent, $100 expedited) and directs DBPR to adjust them for CPI every five years; the DBPR figures above are the ones in force.
   Condominiums: [F.S. 718.116(8)](http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0700-0799/0718/Sections/0718.116.html).
6. [Recording Fees](https://www.sarasotaclerk.com/Records/Recording-Services/Recording-Requirements/Recording-Fees-and-Taxes-Required)  
   Sarasota County Clerk and Manatee County Clerk (both under F.S. 28.24) · checked 2026-10-01  
   $10.00 for the first page of a document and $8.50 for each additional page. The buyer records the deed (FR/BAR 9(b)); the seller records a release of any mortgage under 9(a), recording and other fees needed to cure title.
   Manatee’s schedule is the same: [Manatee County Clerk, recording fees](https://www.manateeclerk.com/departments/recording/recording-fees/).
7. [Residential Contract for Sale and Purchase, Standard K and paragraph 9](<https://www.floridarealtors.org/sites/default/files/2024-08/FloridaRealtors-FloridaBar-6xx[2].pdf>)  
   Florida Realtors and The Florida Bar (form FloridaRealtors/FloridaBar-6xx, Rev. 8/24) · checked 2026-10-01  
   Real estate taxes, CDD assessments and association fees are prorated as of the day prior to the closing date, on the current year's tax at the maximum allowable discount (prior year's if the bill isn't out); estimates are readjusted when the bill arrives. 9(a): the seller pays doc stamps on the deed and the association estoppel fee.
   The maximum discount is 4 percent, for payment in November, under [F.S. 197.162](http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0100-0199/0197/Sections/0197.162.html).
8. [FIRPTA Withholding](https://www.irs.gov/individuals/international-taxpayers/firpta-withholding)  
   Internal Revenue Service · checked 2026-10-01  
   When the seller is a foreign person, the buyer withholds 15% of the amount realized; 10% when the price is $1,000,000 or less and the buyer will live in the home; none at $300,000 or less with the buyer living there. A withholding certificate can reduce it.

Rates change. If a figure here no longer matches its source, the source wins, and we’d like to hear
about it.
