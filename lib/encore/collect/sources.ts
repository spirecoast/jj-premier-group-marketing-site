import type { SourceDef } from "./types";

/**
 * Every source the collector reads, from the source audit (2026-09). The
 * table encore_sources is seeded from this list; a row's `config` there
 * overrides the one here, so a URL can be fixed without a deploy.
 *
 * Sources the audit marked manual (captchas, Cloudflare/Akamai challenges,
 * prose-only gallery pages) are listed with adapter "manual" and are never
 * fetched: their events stay as the review queue and people keep them.
 * `hosts` are the hostnames whose URLs belong to the source; known events
 * whose source or ticket link sits on one of them are this source's
 * "known" list.
 */
export type SourceSpec = SourceDef & { hosts: string[] };

const S = (s: SourceSpec): SourceSpec => s;

export const SOURCES: SourceSpec[] = [
  /* ---- Generic: The Events Calendar (Tribe) REST ---------------------- */
  S({ id: "sarasota-art-museum", domain: "sarasotaartmuseum.org", hosts: ["sarasotaartmuseum.org"], adapter: "tribe", frequency: "weekly", presenter: "Sarasota Art Museum", venueKey: "sarasota-art-museum",
    config: { base: "https://www.sarasotaartmuseum.org", exclude: "^(highlights tour|gallery tour|docent|museum closed|members? (only|hour))" } }),
  S({ id: "sarasota-art-museum-exhibitions", domain: "sarasotaartmuseum.org", hosts: ["sarasotaartmuseum.org"], adapter: "pages", frequency: "monthly", presenter: "Sarasota Art Museum", venueKey: "sarasota-art-museum",
    config: { listings: ["https://www.sarasotaartmuseum.org/exhibitions"], linkPattern: "^https://www\\.sarasotaartmuseum\\.org/(?!event|events|exhibitions|visit|about|support|learn|shop|membership|calendar|wp-|category|tag|contact|privacy|press|careers|rentals|news)[a-z0-9-]+/?$", maxPages: 25 } }),
  S({ id: "the-bay", domain: "thebaysarasota.org", hosts: ["thebaysarasota.org"], adapter: "tribe", frequency: "weekly", presenter: "The Bay Park Conservancy", venueKey: "the-bay-sarasota",
    config: { base: "https://www.thebaysarasota.org", exclude: "yoga|tai chi|boot ?camp|zumba|pilates|bodycombat|primetime|run club|volunteer|kayak|paddle|pickleball|meditation|mindful walk|fitness|sound bath|storytime|story time|veteran.s day" } }),
  S({ id: "scf", domain: "scf.edu", hosts: ["scf.edu", "our.show", "onthestage.tickets"], adapter: "tribe", frequency: "weekly", presenter: "State College of Florida", venueKey: "scf-neel-pac",
    config: { base: "https://www.scf.edu", categories: ["fine-performing-arts", "performing-arts", "music", "theatre", "arts"] } }),
  S({ id: "wbtt", domain: "westcoastblacktheatre.org", hosts: ["westcoastblacktheatre.org"], adapter: "tribe", frequency: "weekly", presenter: "Westcoast Black Theatre Troupe", venueKey: "wbtt",
    config: { base: "https://www.westcoastblacktheatre.org" } }),
  S({ id: "nathan-benderson-park", domain: "nathanbendersonpark.org", hosts: ["nathanbendersonpark.org"], adapter: "tribe", frequency: "monthly", presenter: "Nathan Benderson Park", venueKey: "nathan-benderson-park",
    config: { base: "https://nathanbendersonpark.org", maxPages: 8, include: "festival|fest\\b|oktoberfest|market|concert|music|trick|halloween|parade|art|movie|holiday|lights", exclude: "regatta|rowing|race\\b|marathon|walk\\b|5k|swim|triathlon|sprints|fitness|wellness|park closes" } }),
  S({ id: "circus-arts", domain: "circusarts.org", hosts: ["circusarts.org"], adapter: "tribe", frequency: "weekly", presenter: "The Circus Arts Conservatory", venueKey: "sailor-circus-arena",
    config: { base: "https://circusarts.org" } }),
  S({ id: "herrig-center", domain: "herrigcenter.org", hosts: ["herrigcenter.org"], adapter: "tribe", frequency: "monthly", presenter: "Herrig Center for the Arts", venueKey: "herrig-center",
    config: { base: "https://herrigcenter.org" } }),
  S({ id: "st-barbara", domain: "stbarbarafestival.org", hosts: ["stbarbarafestival.org"], adapter: "tribe", frequency: "monthly", presenter: "St. Barbara Greek Orthodox Church", venueKey: "st-barbara-greek-orthodox-church",
    config: { base: "https://stbarbarafestival.org", exclude: "^(?!.*festival)" } }),
  /* Tribe REST is closed (403); its iCal export is not. */
  S({ id: "halo-arts", domain: "haloartsproject.com", hosts: ["haloartsproject.com"], adapter: "ical", frequency: "monthly", presenter: "Halo Arts Project", venueKey: "halo-arts-project",
    config: { urls: ["https://haloartsproject.com/events/?ical=1"] } }),

  /* ---- Generic: schema.org Event JSON-LD on event pages --------------- */
  S({ id: "selby", domain: "selby.org", hosts: ["selby.org", "selby.ticketapp.org"], adapter: "jsonld", frequency: "weekly", presenter: "Marie Selby Botanical Gardens",
    config: { listings: ["https://selby.org/events/"], linkPattern: "^https://selby\\.org/(events|dsc|hsp)/[^?#]+/[^?#]+", maxPages: 30, exclude: "yoga|tai chi|meditation|walk\\b|members? only|volunteer|class\\b|workshop" } }),
  S({ id: "paragon", domain: "paragonfestivals.com", hosts: ["paragonfestivals.com"], adapter: "jsonld", frequency: "monthly", presenter: "Paragon Art Festivals",
    config: { listings: ["https://www.paragonfestivals.com/art-festivals/", "https://www.paragonfestivals.com/music-festivals/"], linkPattern: "^https://www\\.paragonfestivals\\.com/festival/(sarasota|lakewood|bradenton|st-armands|anna-maria|longboat|coquina|manatee)[a-z0-9-]*/?$", maxPages: 20 } }),
  S({ id: "key-chorale", domain: "keychorale.org", hosts: ["keychorale.org", "keychorale.app.getcuebox.com"], adapter: "jsonld", frequency: "weekly", presenter: "Key Chorale",
    config: { listings: ["https://keychorale.org/concerts/"], linkPattern: "^https://keychorale\\.org/concerts/[a-z0-9-]+/?$", maxPages: 20 } }),
  S({ id: "lwr-wind-ensemble", domain: "jmmsr7973.wixsite.com", hosts: ["jmmsr7973.wixsite.com"], adapter: "jsonld", frequency: "monthly", presenter: "Lakewood Ranch Wind Ensemble",
    config: { listings: ["https://jmmsr7973.wixsite.com/lwrwindensemble"], linkPattern: "/lwrwindensemble/event-details/", maxPages: 12 } }),
  S({ id: "azara-ballet", domain: "azaraballet.org", hosts: ["azaraballet.org"], adapter: "jsonld", frequency: "monthly", presenter: "Azara Ballet",
    config: { listings: ["https://www.azaraballet.org/"], linkPattern: "azaraballet\\.org/event-details/", maxPages: 10 } }),
  S({ id: "vividiance", domain: "vividiance.com", hosts: ["vividiance.com"], adapter: "jsonld", frequency: "monthly", presenter: "Vividiance",
    config: { linkPattern: "vividiance\\.com/event-details/", maxPages: 6 } }),
  S({ id: "qgiv", domain: "secure.qgiv.com", hosts: ["secure.qgiv.com"], adapter: "jsonld", frequency: "monthly", presenter: "",
    config: { linkPattern: "secure\\.qgiv\\.com/(for/[^/]+/)?event/", maxPages: 10 } }),
  S({ id: "pops-orchestra", domain: "thepopsorchestra.org", hosts: ["thepopsorchestra.org", "thepopsorchestra.app.getcuebox.com"], adapter: "jsonld", frequency: "weekly", presenter: "The Pops Orchestra of Bradenton & Sarasota",
    config: { listings: ["https://www.thepopsorchestra.org/concerts"], linkPattern: "thepopsorchestra\\.app\\.getcuebox\\.com/o/[^/]+/shows/[^/]+", maxPages: 20 } }),
  S({ id: "library-market", domain: "scgovlibrary.librarymarket.com", hosts: ["scgovlibrary.librarymarket.com"], adapter: "jsonld", frequency: "monthly", presenter: "Sarasota County Libraries",
    config: { linkPattern: "librarymarket\\.com/event/", maxPages: 6 } }),
  S({ id: "water-lantern", domain: "waterlanternfestival.com", hosts: ["waterlanternfestival.com"], adapter: "jsonld", frequency: "monthly", presenter: "Water Lantern Festival",
    config: { pages: ["https://www.waterlanternfestival.com/events/sarasota"] } }),

  /* ---- Generic: Squarespace events collections ------------------------ */
  /* robots.txt closes ?format=json and ?format=ical to every crawler, so the event pages' JSON-LD it is.
     The squarespace adapter stays for collections whose robots.txt allows it. */
  S({ id: "jazz-club", domain: "jazzclubsarasota.org", hosts: ["jazzclubsarasota.org"], adapter: "jsonld", frequency: "weekly", presenter: "Jazz Club of Sarasota",
    config: { listings: ["https://www.jazzclubsarasota.org/events"], linkPattern: "^https://www\\.jazzclubsarasota\\.org/events/[a-z0-9-]+$", maxPages: 30 } }),

  /* ---- Platform: Tessitura TNEW --------------------------------------- */
  S({ id: "sarasota-orchestra", domain: "sarasotaorchestra.org", hosts: ["sarasotaorchestra.org", "buy.sarasotaorchestra.org"], adapter: "tnew", frequency: "weekly", presenter: "Sarasota Orchestra",
    config: { base: "https://buy.sarasotaorchestra.org" } }),
  S({ id: "ringling-tickets", domain: "my.ringling.org", hosts: ["my.ringling.org"], adapter: "tnew", frequency: "weekly", presenter: "The Ringling", venueKey: "the-ringling",
    config: { base: "https://my.ringling.org", exclude: "admission|membership|gift|donation|parking|ca' d'zan|tour\\b|tours\\b|photo shoot|gardens only|yoga|stroller|homeschool|book club|masterclass|wonder day|artself" } }),
  S({ id: "asolo-rep", domain: "asolorep.org", hosts: ["asolorep.org", "tickets.asolorep.org"], adapter: "tnew", frequency: "weekly", presenter: "Asolo Repertory Theatre", venueKey: "fsu-center",
    config: { base: "https://tickets.asolorep.org" } }),
  S({ id: "sarasota-opera", domain: "sarasotaopera.org", hosts: ["sarasotaopera.org", "tickets.sarasotaopera.org", "event.sarasotaopera.org"], adapter: "tnew", frequency: "weekly", presenter: "Sarasota Opera", venueKey: "sarasota-opera-house",
    config: { base: "https://tickets.sarasotaopera.org" } }),
  S({ id: "sarasota-ballet", domain: "sarasotaballet.org", hosts: ["sarasotaballet.org", "cart.sarasotaballet.org"], adapter: "tnew", frequency: "weekly", presenter: "The Sarasota Ballet",
    config: { base: "https://cart.sarasotaballet.org" } }),

  /* ---- Platform: OvationTix ------------------------------------------- */
  S({ id: "artist-series", domain: "artistseriesconcerts.org", hosts: ["artistseriesconcerts.org"], adapter: "ovationtix", frequency: "weekly", presenter: "Artist Series Concerts of Sarasota", config: { clientId: "35190" } }),
  S({ id: "sarasota-contemporary-dance", domain: "sarasotacontemporarydance.org", hosts: ["sarasotacontemporarydance.org"], adapter: "ovationtix", frequency: "weekly", presenter: "Sarasota Contemporary Dance", config: { clientId: "35361", exclude: "^virtual\\b" } }),
  S({ id: "urbanite", domain: "urbanitetheatre.com", hosts: ["urbanitetheatre.com"], adapter: "ovationtix", frequency: "weekly", presenter: "Urbanite Theatre", venueKey: "urbanite-theatre", config: { clientId: "34772" } }),
  S({ id: "sarasota-concert-association", domain: "scasarasota.org", hosts: ["scasarasota.org"], adapter: "ovationtix", frequency: "weekly", presenter: "Sarasota Concert Association", venueKey: "sarasota-opera-house", config: { clientId: "35453" } }),
  S({ id: "via-nova", domain: "vianovachorale.org", hosts: ["vianovachorale.org"], adapter: "ovationtix", frequency: "monthly", presenter: "Via Nova Chorale", config: { clientId: "36991" } }),

  /* ---- Platform: TicketSpice ------------------------------------------ */
  S({ id: "ticketspice", domain: "ticketspice.com", hosts: ["ticketspice.com"], adapter: "ticketspice", frequency: "weekly", presenter: "",
    config: { index: "https://chamberorchestraofsarasota.ticketspice.com/" } }),

  /* ---- Per-site HTML --------------------------------------------------- */
  S({ id: "sill", domain: "sillsarasota.org", hosts: ["sillsarasota.org"], adapter: "sill", frequency: "monthly", presenter: "Sarasota Institute of Lifetime Learning (SILL)",
    config: { url: "https://sillsarasota.org/season-at-a-glance/", price: "$20 at the door (series/flex passes available)", venues: { "church of the palms": "church-of-the-palms", "1st methodist church": "fumc-sarasota", "cornerstone church": "cornerstone-church-lwr" } } }),
  S({ id: "van-wezel", domain: "vanwezel.org", hosts: ["vanwezel.org", "mpv.tickets.com"], adapter: "vanwezel", frequency: "weekly", presenter: "Van Wezel Performing Arts Hall", venueKey: "van-wezel", config: {} }),
  S({ id: "mccurdys", domain: "mccurdyscomedy.com", hosts: ["mccurdyscomedy.com"], adapter: "pages", frequency: "weekly", presenter: "McCurdy's Comedy Theatre", venueKey: "mccurdys-comedy-theatre",
    config: { listings: ["https://www.mccurdyscomedy.com/shows"], linkPattern: "mccurdyscomedy\\.com/shows/show\\.cfm\\?shoid=\\d+$", extractor: "mccurdys", maxPages: 45, exclude: "^closed\\b|private event|class performance|^fundraiser" } }),
  S({ id: "manatee-pac", domain: "manateeperformingartscenter.com", hosts: ["manateeperformingartscenter.com", "purchase.boxofficecentral.com"], adapter: "mpac", frequency: "weekly", presenter: "Manatee Performing Arts Center", venueKey: "manatee-pac",
    config: { url: "https://www.manateeperformingartscenter.com/" } }),
  S({ id: "wslr", domain: "wslr.org", hosts: ["wslr.org", "wslrfogartyville.ticketspice.com"], adapter: "pages", frequency: "weekly", presenter: "WSLR + Fogartyville", venueKey: "fogartyville",
    config: { listings: ["https://wslr.org/events/", "https://wslr.org/events/page/2/", "https://wslr.org/events/page/3/", "https://wslr.org/events/page/4/"], linkPattern: "^https://wslr\\.org/event/[a-z0-9-]+/?$", extractor: "wslr", maxPages: 45, exclude: "forum|roundtable|talk of the town|board meeting|volunteer|training|workshop" } }),
  S({ id: "lakewood-ranch", domain: "lakewoodranch.com", hosts: ["lakewoodranch.com"], adapter: "pages", frequency: "weekly", presenter: "Lakewood Ranch",
    config: { listings: ["https://lakewoodranch.com/sights-sounds/", "https://lakewoodranch.com/events/"], linkPattern: "^https://lakewoodranch\\.com/event/[a-z0-9-]+/?$", maxPages: 30 } }),
  S({ id: "florida-studio-theatre", domain: "floridastudiotheatre.org", hosts: ["floridastudiotheatre.org"], adapter: "pages", frequency: "weekly", presenter: "Florida Studio Theatre", venueKey: "florida-studio-theatre",
    config: { listings: ["https://www.floridastudiotheatre.org/events-and-tickets"], linkPattern: "^https://www\\.floridastudiotheatre\\.org/events-and-tickets/[a-z0-9-]+/[a-z0-9-]+/?$", maxPages: 35 } }),
  S({ id: "ringling", domain: "ringling.org", hosts: ["ringling.org"], adapter: "pages", frequency: "weekly", presenter: "The Ringling", venueKey: "the-ringling",
    config: { listings: ["https://www.ringling.org/event-list/", "https://www.ringling.org/exhibitions/"], linkPattern: "^https://www\\.ringling\\.org/event/[a-z0-9-]+/?$", maxPages: 50 } }),
  S({ id: "sarasota-orchestra-pages", domain: "sarasotaorchestra.org", hosts: ["sarasotaorchestra.org"], adapter: "pages", frequency: "monthly", presenter: "Sarasota Orchestra",
    config: { linkPattern: "^https://www\\.sarasotaorchestra\\.org/(concerts|about/community)/", maxPages: 30 } }),
  S({ id: "film-society", domain: "filmsociety.org", hosts: ["filmsociety.org"], adapter: "pages", frequency: "weekly", presenter: "Sarasota Film Society", venueKey: "burns-court-cinema",
    config: { linkPattern: "filmsociety\\.org/movies/upcoming/movie\\.cfm\\?filID=\\d+", maxPages: 12 } }),
  S({ id: "artfestival", domain: "artfestival.com", hosts: ["artfestival.com"], adapter: "pages", frequency: "monthly", presenter: "Howard Alan Events",
    config: { linkPattern: "^https://www\\.artfestival\\.com/festivals/", maxPages: 12 } }),
  S({ id: "ensrq", domain: "ensrq.org", hosts: ["ensrq.org"], adapter: "pages", frequency: "monthly", presenter: "EnsembleNewSRQ",
    config: { linkPattern: "^https://www\\.ensrq\\.org/seasons/", maxPages: 10 } }),
  S({ id: "realize-bradenton", domain: "realizebradenton.com", hosts: ["realizebradenton.com"], adapter: "pages", frequency: "monthly", presenter: "Realize Bradenton",
    config: { linkPattern: "^https://www\\.realizebradenton\\.com/", maxPages: 8 } }),
  S({ id: "island-players", domain: "theislandplayers.org", hosts: ["theislandplayers.org"], adapter: "pages", frequency: "monthly", presenter: "The Island Players", venueKey: "island-players",
    config: { linkPattern: "^https://www\\.theislandplayers\\.org/[a-z0-9-]+$", maxPages: 8 } }),
  S({ id: "bishop", domain: "bishopscience.org", hosts: ["bishopscience.org"], adapter: "pages", frequency: "monthly", presenter: "The Bishop Museum of Science and Nature", venueKey: "bishop-museum",
    config: { linkPattern: "^https://bishopscience\\.org/", maxPages: 8 } }),
  S({ id: "ringling-college-galleries", domain: "ringlingcollege.gallery", hosts: ["ringlingcollege.gallery"], adapter: "pages", frequency: "monthly", presenter: "Ringling College Galleries", venueKey: "ringling-college",
    config: { listings: ["https://www.ringlingcollege.gallery/whats-on"], linkPattern: "ringlingcollege\\.gallery/exhibitions/", maxPages: 20 } }),

  /* ---- Manual: no fetch (captcha, JS challenge, Akamai, prose pages) ---- */
  ...(
    [
      ["artsarasota.org", "Art Center Sarasota"],
      ["502.gallery", "502 Gallery"],
      ["srqcubanballet.org", "Sarasota Cuban Ballet School"],
      ["lamusica.org", "La Musica"],
      ["theplayers.org", "The Players Centre for Performing Arts"],
      ["spaaces.art", "SPAACES"],
      ["villageofthearts.org", "Village of the Arts"],
      ["perlmanmusicprogramsuncoast.org", "Perlman Music Program Suncoast"],
      ["sarasotafl.gov", "City of Sarasota"],
      ["ringlingcollegetownhall.org", "Ringling College Town Hall"],
      ["chorusofthekeys.org", "Chorus of the Keys"],
      ["guitarsarasota.org", "Guitar Sarasota"],
      ["art.artovationhotel.com", "Art Ovation Hotel"],
      ["sarasotajewishtheatre.com", "Sarasota Jewish Theatre"],
      ["desotohq.com", "DeSoto Heritage Festival"],
      ["floridamaritimemuseum.org", "Florida Maritime Museum"],
      ["destinationdowntownsarasota.com", "Destination Downtown Sarasota"],
      ["artsadvocates.org", "Arts Advocates"],
      ["sarasotamedievalfair.com", "Sarasota Medieval Fair"],
      ["towlescourt.com", "Towles Court"],
      ["theatreodyssey.org", "Theatre Odyssey"],
      ["siestakeycrystalclassic.com", "Siesta Key Crystal Classic"],
      ["architecturesarasota.org", "Architecture Sarasota"],
      ["creartelatino.org", "Crearte Latino"],
      ["cortezvillagehistoricalsociety.org", "Cortez Village Historical Society"],
      ["roserchurch.com", "Roser Memorial Church"],
      ["musiccompound.com", "Music Compound"],
      ["caalr.com", "Community Association of Lakewood Ranch"],
      ["dancingsrq.com", "Dancing SRQ"],
      ["manateevillage.org", "Manatee Village Historical Park"],
      ["suncoastscots.com", "Suncoast Scots"],
      ["creativeliberties.net", "Creative Liberties"],
      ["sarasotafarmersmarket.org", "Sarasota Farmers Market"],
      ["shows.milanartgallery.com", "Milan Art Gallery"],
      ["sarasotafilmfestival.com", "Sarasota Film Festival"],
    ] as const
  ).map(([domain, presenter]) =>
    S({ id: `manual-${domain.replace(/[^a-z0-9]+/g, "-")}`, domain, hosts: [domain], adapter: "manual", frequency: "manual", presenter, config: {} }),
  ),
];

export function sourceById(id: string): SourceSpec | undefined {
  return SOURCES.find((s) => s.id === id);
}

/** The source a URL belongs to, by host (longest host match wins). */
export function sourceForUrl(url: string | undefined | null, sources: SourceSpec[] = SOURCES): SourceSpec | undefined {
  if (!url) return undefined;
  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
  let best: SourceSpec | undefined;
  let len = -1;
  for (const s of sources) {
    for (const h of s.hosts) {
      if ((host === h || host.endsWith(`.${h}`)) && h.length > len) {
        best = s;
        len = h.length;
      }
    }
  }
  return best;
}
