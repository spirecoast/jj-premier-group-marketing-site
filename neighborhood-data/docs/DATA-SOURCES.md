# Data sources

Every source the dataset uses, what each one supports, how to query it, and how often it changes.
The counts are the number of source entries (record × source) in `data/neighborhoods.json` as of 2026-09-23;
227 domains in total. `data/sources.csv` has every entry with its checked date.

Access notes are what worked from a normal browser and from Node in September 2026. Hosts change; if a
query fails, open the layer's REST page (the URL without `/query`) in a browser to see its current fields.

## Primary vs. discovery-only

- **Primary (a fact may cite only these):** city, county and town sites and map services; the school districts'
  own locators; county emergency-management evacuation layers; property appraisers; Florida's official
  special-district list and each CDD's own site; sunbiz.org (association legal names and status only);
  Lakewood Ranch's own sites (lakewoodranch.com, mylwr.com); developer and builder sites (their own domains);
  HOA / POA / condo-association sites.
- **Discovery only (find names and URLs, never cite):** Zillow, Realtor.com, Redfin, Niche, Homes.com,
  NewHomeSource, 55places, brokerage/agent blogs, Wikipedia, news sites, review sites, HOA-management-company
  portals and business directories (bizapedia, opencorporates, dnb, manta, yelp…).

---

## 1. County map services (the backbone)

All are ArcGIS REST layers. Query with `<layer>/query?...&f=json`. Point queries use
`geometry=<lng>,<lat>&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects`.
ArcGIS layers are CORS-open (work from browser JavaScript and from Node). `scripts/refresh-gis.mjs` runs all of
the address, jurisdiction, school and evacuation lookups below.

### Manatee County

| Layer | URL | Fields used | Supports | Entries |
|---|---|---|---|---|
| Neighborhoods (registry) | `https://www.mymanatee.org/giscomm/rest/services/communityneighborhood/neighborhoods/FeatureServer/0` (also `/MapServer/0`) | `NEIGHBORHOOD`, `COMMUNITY`, `MUN` (code), `SIGN` | existence, name, parent community, representative point | 1,548 + 1,500 |
| Neighborhood HOA layer | `https://www.mymanatee.org/giscomm/rest/services/communityneighborhood/neighborhoodhoa/MapServer/0` | association name | existence, hoa | 46 |
| Address points | `https://services1.arcgis.com/t03WDvnSR7gSDOB2/arcgis/rest/services/ADDRESS_POINTS/FeatureServer/2` | `ST_NUM`, `SDIRPRE`, `SFEANME`, `SFEATYP`, `SDIRSUF`, `ZIP`, `POSTAL_COMMUNITY`, `MUN`, `DEVELOPMENT_NAME` | zips, checked address, postal community (scope), jurisdiction fallback | 1,746 |
| City boundaries | `https://services1.arcgis.com/t03WDvnSR7gSDOB2/arcgis/rest/services/CITY_BOUNDARIES/FeatureServer/0` | `NAME` (Bradenton, Palmetto, Anna Maria, Holmes Beach, Bradenton Beach, Longboat Key; "North County"/"South County" = unincorporated) | jurisdiction | 1,685 |
| Evacuation levels | `https://services1.arcgis.com/t03WDvnSR7gSDOB2/arcgis/rest/services/Evacuation%20Levels%20Feature%20Service/FeatureServer/0` | `EVAC_ZONE` (A–E; `N/A` = outside every level) | evacuationZone | 1,685 |
| CDD boundaries | `https://services1.arcgis.com/t03WDvnSR7gSDOB2/arcgis/rest/services/CDD/FeatureServer/0` | `CDD_NAME` | cdd (with a state-list or CDD-site source) | 45 |
| Parcels | `https://services1.arcgis.com/t03WDvnSR7gSDOB2/arcgis/rest/services/GIS_PARCELS/FeatureServer/0` | `SUBDIVISION` | existence, zips, points for plats | 27 |
| City of Bradenton complexes | `https://services6.arcgis.com/wl0q8tN2gn8MMx1p/arcgis/rest/services/complexes_CoB_pt/FeatureServer/0` | name, point | existence, name, point | 97 |

Human-facing page for evacuation: `https://www.mymanatee.org/services-and-amenities/service-listing/service-details/know-your-evacuation-level`.
Manatee PAO data pages (`https://www.manateepao.gov/DATA/…`) back CDD existence/levy (40).

### Sarasota County

| Layer | URL | Fields used | Supports | Entries |
|---|---|---|---|---|
| Address points | `https://ags3.scgov.net/server/rest/services/Hosted/AddressPoint/FeatureServer/0` | `address`, `zip`, `postalcomm`, `muni` (CS, SC, TLK, CV, CNP) | zips, checked address, jurisdiction, scope | 314 |
| Plat boundaries | `https://ags3.scgov.net/server/rest/services/Hosted/PlatBoundary/FeatureServer/0` | plat name, book/page, point | existence, point | 219 |
| Parcel appraisal | `https://ags3.scgov.net/server/rest/services/Hosted/ParcelAppraisal2/FeatureServer/0` | `subname`, `subd` only — **`name1` is the owner; never request it** | point | 40 |
| Neighborhood associations | `https://ags3.scgov.net/server/rest/services/Hosted/NeighborhoodAssociation/FeatureServer/0` | `associationname`, `registrationstatus`, `associationtype`, `city`, `zipcode`, `website`, `numberodhomesunits`, `gatedsecured`, `mobilemanufacturedhomes`, `agerestrictions`, `masterassociationname` — **also holds contact names/emails/phones/addresses; never request those fields** | existence, hoa | 51 |
| Neighborhood registry pages | `https://neighborhoods.scgov.net/NeighborhoodAssociations/…` | association page | existence, name, hoa | 184 |
| Evacuation zones | `https://services3.arcgis.com/icrWMv7eBkctFu1f/arcgis/rest/services/StormEvacuationZoneWM/FeatureServer/0` | `EvacuationZone` (A–E; no feature = none) | evacuationZone | 263 |
| Address points (county mirror) | `https://services3.arcgis.com/AWDwYUpli8WqpWxQ/arcgis/rest/services/Sarasota_County_Address_Points/FeatureServer/0` | postal community, muni | jurisdiction | 29 |
| Municipal boundary | `https://services3.arcgis.com/AWDwYUpli8WqpWxQ/arcgis/rest/services/Municipal_Boundary_(View_Only)/FeatureServer/0` | city limits | jurisdiction | 52 |

Human-facing page for evacuation: `https://www.scgov.net/know-your-evacuation-zone`.
Notices of decision on `ftp.scgov.net/NOD/…` back 8 records.

### City of Sarasota

| Source | URL | Supports | Entries |
|---|---|---|---|
| Neighborhoods layer | `https://services3.arcgis.com/AWDwYUpli8WqpWxQ/arcgis/rest/services/Neighborhoods/FeatureServer/0` (`NAME`, `Association`, `Label`, `Website`; **skip `Email`**) | existence, name, point | 58 |
| Neighborhoods page | `https://www.sarasotafl.gov/Department-Pages/Planning/Neighborhoods` | registered associations | 59 |
| Parks & neighborhood-association map (Aug 2025 PDF) | `https://www.sarasotafl.gov/files/assets/city/v/2/planning/documents/city-of-sarasota-parks-and-neighborhood-association-map-august-2025.pdf` | existence, name | 57 |
| Historic preservation PDFs | `…/historic-preservation-program/nr_list_0220accessible.pdf`, `…/historic-designations-061819-revised-3accessible.pdf` | historic districts | 13 |

### Towns and island cities

City of Anna Maria (`cityofannamaria.com`), City of Bradenton (`cityofbradenton.com`), Town of Longboat Key
(`longboatkey.org`, plus its `Longboat_Key_Condominiums_2024` layer at
`https://services2.arcgis.com/Lu7Uh8HEPwu0SbYS/arcgis/rest/services/Longboat_Key_Condominiums_2024/FeatureServer/14`).

---

## 2. School zones

Schools are stored exactly as the district locator returns them, with the locator link and the note
"Zoning is by address and can change". No ratings, ever.

| District | How the dataset queries it | Link shown to users | Entries |
|---|---|---|---|
| Manatee | GuideK12 API, `POST https://app.guidek12.com/manateefl/school_search/2026/api.json` with `{"mode":"list_schools"}` (id → `school_label`, `attr.SCHOOL_TYPE` ELEM/MIDD/HIGH) and `{"mode":"schools_spatial","attr":{},"grades":[],"spatial_args":{"wkt":"POINT(<lng> <lat>)","srid":4326,"type":"point"},"zones":["attendance"]}` → `result.in_district`, `result.school_results[].id` | `https://app.guidek12.com/manateefl/school_search/2026/` (district page: `https://www.manateeschools.net/schoollocator`) | 1,685 |
| Sarasota | `https://services3.arcgis.com/icrWMv7eBkctFu1f/arcgis/rest/services/CountySchoolDistricts/FeatureServer/1` point query, `SchoolZone`, `ZoneType` (Public Elementary / Middle / High / K-8 School) — the layer behind the district's lookup app. K-8 zones fill both elementary and middle. Names end in "Zone". | `https://sarco.maps.arcgis.com/apps/instant/lookup/index.html?appid=1e2e26c033b341a3a1791e81906d26f9` (district page: `https://www.sarasotacountyschools.net/page/student-attendance-zones`) | 263 |

**Manatee year path.** The `/2026/` in the GuideK12 URL is the 2026-27 school year. When the district posts the
next year's locator, run `node scripts/refresh-gis.mjs --school-year 2027` (it rewrites the URL, note and source).
Manatee high-school zones change for 2027-28, so that refresh matters.
GuideK12's API worked from the app.guidek12.com page and is expected to work from Node (no CORS server-side);
if it refuses server requests, run the lookups from a browser tab on app.guidek12.com.

---

## 3. Special districts, associations, historic register

| Source | URL | Supports | Entries | Notes |
|---|---|---|---|---|
| FloridaCommerce special-district list | `https://specialdistrictreports.floridajobs.org/OfficialList/…` | CDD listing | 58 | Returns 403 to automated requests; open in a browser. |
| Florida Auditor General | `https://flauditor.gov/pages/…` | CDD existence, audits | 54 | |
| sunbiz.org (Division of Corporations) | `https://search.sunbiz.org/Inquiry/…` | `hoa.name` (legal name), active/inactive | 58 | **Never record officers, registered agents, member names, emails, phones or street addresses.** |
| Lakewood Ranch Town Hall / districts | `https://mylwr.com/cms/town-hall`, `https://mylwr.com/<id>/<Name>` pages | hoa (Town Hall-managed associations), existence | 32 | Many mylwr.com pages are JavaScript-only. |
| LWR documents (CivicPlus) | `https://content.civicplus.com/api/assets/…` | existence, parent village | 143 | PDFs; check their dates (some are 2019). |
| National Register (NPS) | `https://npgallery.nps.gov/NRHP/…`; points from `https://mapservices.nps.gov/arcgis/rest/services/cultural_resources/nrhp_locations/MapServer/1` (`RESNAME`, `State`, `City`) | historic districts, description | 17 | Period of significance ≠ years built. |
| U.S. Census TIGERweb | `https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Places_CouSub_ConCity_SubMCD/MapServer` (layer 4 incorporated places, 5 CDPs; `INTPTLAT`/`INTPTLON`) | area points | 4 | |

---

## 4. Developer and builder sites

Builder pages support `status`, `activeBuilders`, `homeTypes`, `amenities` on the checked date only. They go stale
fastest; `scripts/check-builders.mjs` re-reads them.

| Builder / developer | How status is read | Access notes |
|---|---|---|
| Lakewood Ranch (lakewoodranch.com, 270 entries) | Village pages; villages list via `https://lakewoodranch.com/wp-json/wp/v2/villages?per_page=100` | WordPress API is open. |
| PulteGroup — Pulte, Del Webb, Centex, DiVosta | Map-marker API `https://www.pulte.com/api/marker/mapmarkers?brand=<brand>&state=Florida&region=<region>&qmi=false` (brands: Pulte, Del Webb, Centex, DiVosta; regions: Sarasota, Tampa) → `Id`, `Name`, `BrandName`, `CommunityStatus` (marketing text), `IsCommunitySoldOut`, `IsActiveAdult`, `CommunityLink`, `Address`, `Latitude`, `Longitude`. `Id` = the number at the end of the community URL. Absent from the API = no longer listed. | List pages are client-rendered; use the API. `IsActiveAdult` is the builder's label, **not** a HOPA document. |
| Taylor Morrison | Page HTML contains `"community-status":"OPEN"` / `"COMINGSOON"` / `"CLOSED"` | May block server requests. |
| Lennar | Community page text "Actively selling"; redirect to the metro page = no longer listed. Metro pages (`/new-homes/florida/sarasota-manatee`, `/tampa-manatee`) carry `__NEXT_DATA__` → `props.pageProps.initialApolloState` entries `CommunityType:*` / `MpcType:*` with `name`, `url`, `status` (ACTIVE, COMING_SOON, SOLD_OUT), `city`. | |
| M/I Homes | Community page "Community Status Now Selling" vs "No Longer Available"; community list from `https://www.mihomes.com/Sitemap/sitemap.xml` (`/new-homes/florida/<metro>/<city>/<community>`) | Cloudflare may block Node. |
| Meritage | Community page "Priced from" / "Sales Office" = selling | List pages are JS. |
| Mattamy | Community page "NOW SELLING"; lists at `https://mattamyhomes.com/florida/bradenton`, `/sarasota`, `/tampa` | |
| Homes by WestBay | Community pages are server-rendered; list page is JS | |
| D.R. Horton, KB Home, Medallion Home, Neal Communities, Lee Wetherington, John Cannon, Ryan Homes, David Weekley, Toll Brothers, Kolter, Highland, Cardel, Dream Finders, Ashton Woods, Starlight, Homes by Towne, AR Homes, Anchor Builders | Community pages; no reliable status marker → checker reports phrases only | Check by hand when flagged. |
| Perry Homes, Richmond American | JavaScript-only | Browser only. Richmond American communities in scope: Maple Ridge, Estates at Rivers Edge, Rye Manor. |
| Palmer Ranch Master Association | Member list at `https://www.palmerranch.net/Community`; details at `https://www.palmerranch.net/_ajax/handler?dowhat=member_details&cid=<n>` (ids from `showDetails(n)`) | Skip any personal contact details. |

HOA / condo-association sites (townsq.io portals, association domains) back `officialUrl`, `hoa`, `amenities`,
`gated`. Management-company pages (e.g. cscmsi.com) are not accepted as `officialUrl` or `hoa.website`.

---

## 5. Change cadence (what to refresh when)

| What | Changes | Refresh with |
|---|---|---|
| Builder status, active builders, new builder communities | Monthly | `check-builders.mjs`, `discover.mjs` |
| County / city registries (new neighborhoods, renamed associations) | Quarterly | `discover.mjs` |
| New plats and address points in growth areas (Parrish, east Lakewood Ranch, Palmetto) | Quarterly | `discover.mjs`, then `refresh-gis.mjs` for new records |
| School attendance zones | Yearly, when the districts post the next year (Manatee high-school rezoning for 2027-28) | `refresh-gis.mjs --only schools --school-year <yyyy>` |
| Evacuation zones | Rarely; check before each hurricane season (by June 1) | `refresh-gis.mjs --only evac` |
| City limits (annexations) | Occasionally | `refresh-gis.mjs --only address` |
| HOA / association sites, CDDs, historic districts | Slowly; spot-check stale sources yearly | By hand (see RESEARCH-RULES.md) |

Stale-source rule: a source whose own published date is more than about two years old is flagged in `notes`
and counted by `validate.mjs` (170 records at export).
