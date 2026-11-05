import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { PLACES_CAP, PLACES_VISITOR_CAP, type Take } from "./caps";
import { PHOTO_PX, fetchPhotoUri, firstPhoto, grantPhotos, isGooglePhotoUri, isPhotoName, photoMediaUrl, photoRoom, type PhotoDeps, type PlacePhoto } from "./photo";
import { rank, type RawPlace } from "./rank";

const NAME = "places/ChIJN1t_tDeuEmsRUsoyG83frY4/photos/AUc7tXX9_abc-123";
const URI = "https://lh3.googleusercontent.com/places/ANXAkqF-abc=s240";

/** A recorder for the order things happen in, with each step's answer set by the test. */
function deps(o: { key?: string; visitor?: boolean | "throw"; call?: Take | "throw"; status?: number; body?: unknown; fetchThrows?: boolean } = {}) {
  const log: string[] = [];
  const d: PhotoDeps = {
    key: "key" in o ? o.key : "test-key",
    takeVisitor: async () => {
      log.push("visitor");
      if (o.visitor === "throw") throw new Error("db down");
      return { ok: o.visitor ?? true };
    },
    takeCall: async () => {
      log.push("call");
      if (o.call === "throw") throw new Error("db down");
      return o.call ?? { ok: true };
    },
    fetch: async (url, init) => {
      log.push(`fetch ${url} ${(init.headers as Record<string, string>)["X-Goog-Api-Key"]}`);
      if (o.fetchThrows) throw new Error("timeout");
      return new Response(JSON.stringify(o.body ?? { name: NAME, photoUri: URI }), { status: o.status ?? 200 });
    },
  };
  return { d, log };
}

describe("places: the caps never go up", () => {
  test("30 a day and 900 a month per SKU, 8 a visitor", () => {
    assert.deepEqual(PLACES_CAP, { day: 30, month: 900 });
    assert.equal(PLACES_VISITOR_CAP, 8);
  });
});

describe("places: photo names and addresses", () => {
  test("only Google's photo shape is accepted", () => {
    assert.equal(isPhotoName(NAME), true);
    for (const bad of ["", "places/x", "places/x/photos/", "places/../photos/y", "https://evil.example/photos/y", "places/x/photos/y?key=1", `places/x/photos/${"a".repeat(1025)}`, null, 7]) {
      assert.equal(isPhotoName(bad), false, String(bad));
    }
  });

  test("the media request asks for a small photo as JSON, so the key stays on the server", () => {
    const url = new URL(photoMediaUrl(NAME));
    assert.equal(url.origin + url.pathname, `https://places.googleapis.com/v1/${NAME}/media`);
    assert.equal(url.searchParams.get("maxWidthPx"), String(PHOTO_PX));
    assert.equal(url.searchParams.get("maxHeightPx"), String(PHOTO_PX));
    assert.equal(url.searchParams.get("skipHttpRedirect"), "true");
    assert.equal(url.searchParams.has("key"), false);
    assert.ok(PHOTO_PX >= 200 && PHOTO_PX <= 240);
  });

  test("only an https address on Google's image host is passed on", () => {
    assert.equal(isGooglePhotoUri(URI), true);
    assert.equal(isGooglePhotoUri("http://lh3.googleusercontent.com/x"), false);
    assert.equal(isGooglePhotoUri("https://googleusercontent.com.evil.example/x"), false);
    assert.equal(isGooglePhotoUri("javascript:alert(1)"), false);
    assert.equal(isGooglePhotoUri(undefined), false);
  });

  test("the first usable photo is kept with its credit and its page on Google Maps", () => {
    const p = firstPhoto([
      { name: "not-a-photo" },
      { name: NAME, authorAttributions: [{ displayName: " Ana R ", uri: "https://maps.google.com/maps/contrib/1" }, { displayName: "" }, { displayName: "Lee", uri: "javascript:x" }], googleMapsUri: "https://www.google.com/maps/place//data=x" },
    ]);
    assert.deepEqual(p, {
      name: NAME,
      authors: [
        { name: "Ana R", uri: "https://maps.google.com/maps/contrib/1" },
        { name: "Lee", uri: undefined },
      ],
      mapsUri: "https://www.google.com/maps/place//data=x",
    });
    assert.equal(firstPhoto(undefined), undefined);
    assert.equal(firstPhoto([]), undefined);
  });
});

describe("places: what's left for photos", () => {
  test("the least of the site's day, the site's month and the visitor's day", () => {
    assert.equal(photoRoom({ day: 0, month: 0, visitor: 0 }), 8);
    assert.equal(photoRoom({ day: 27, month: 27, visitor: 0 }), 3);
    assert.equal(photoRoom({ day: 0, month: 898, visitor: 0 }), 2);
    assert.equal(photoRoom({ day: 3, month: 40, visitor: 6 }), 2);
  });
  test("never below zero, and nothing for an answer that isn't a number", () => {
    assert.equal(photoRoom({ day: 31, month: 0, visitor: 0 }), 0);
    assert.equal(photoRoom({ day: Number.NaN, month: 0, visitor: 0 }), 0);
  });
});

describe("places: a list's photos, all or none", () => {
  const photo = (n: number): PlacePhoto => ({ name: `places/p${n}/photos/f${n}`, authors: [] });
  const list = [1, 2, 3, 4, 5].map((n) => ({ id: `p${n}`, photo: photo(n) }));

  test("every photo when they all fit", () => {
    assert.equal(grantPhotos(list, 5), list);
    assert.equal(grantPhotos(list, 8), list);
  });
  test("none when they don't all fit, so no list mixes rows with and without", () => {
    const out = grantPhotos(list, 4);
    assert.equal(out.length, 5);
    assert.ok(out.every((p) => !("photo" in p)));
    assert.ok(grantPhotos(list, 0).every((p) => !("photo" in p)));
  });
  test("a list where only some places have a photo needs room for those", () => {
    const some = [{ id: "a", photo: photo(1) }, { id: "b" }, { id: "c", photo: photo(3) }];
    assert.equal(grantPhotos(some, 2), some);
    assert.deepEqual(grantPhotos(some, 1), [{ id: "a" }, { id: "b" }, { id: "c" }]);
  });
  test("ranking keeps a place's photo, and a place without one has none", () => {
    const raw: RawPlace[] = [
      { id: "a", name: "A", rating: 4.6, count: 400, status: "OPERATIONAL", photo: photo(1) },
      { id: "b", name: "B", rating: 4.5, count: 300, status: "OPERATIONAL" },
    ];
    const [a, b] = rank(raw);
    assert.deepEqual(a?.photo, photo(1));
    assert.equal(b && "photo" in b, false);
  });
});

describe("places: fetching one photo", () => {
  test("counted for the visitor, then on the photo SKU, then fetched with the key in a header", async () => {
    const { d, log } = deps();
    assert.deepEqual(await fetchPhotoUri(NAME, d), { ok: true, uri: URI });
    assert.deepEqual(log, ["visitor", "call", `fetch ${photoMediaUrl(NAME)} test-key`]);
  });

  test("a bad name or no key: nothing is counted and Google isn't asked", async () => {
    for (const [name, o, reason] of [
      ["places/../x", {}, "name"],
      [NAME, { key: undefined }, "key"],
      [NAME, { key: "" }, "key"],
    ] as const) {
      const { d, log } = deps(o);
      assert.deepEqual(await fetchPhotoUri(name, d), { ok: false, reason });
      assert.deepEqual(log, []);
    }
  });

  test("this visitor's photos used up: no site count, no call", async () => {
    const { d, log } = deps({ visitor: false });
    assert.deepEqual(await fetchPhotoUri(NAME, d), { ok: false, reason: "visitor" });
    assert.deepEqual(log, ["visitor"]);
  });

  test("the visitor count can't be read: fails closed", async () => {
    const { d, log } = deps({ visitor: "throw" });
    assert.deepEqual(await fetchPhotoUri(NAME, d), { ok: false, reason: "visitor" });
    assert.deepEqual(log, ["visitor"]);
  });

  test("the site's day or month used up, or the count missing: no call", async () => {
    for (const call of [{ ok: false, reason: "day" }, { ok: false, reason: "month" }, { ok: false, reason: "error" }] as const) {
      const { d, log } = deps({ call });
      assert.deepEqual(await fetchPhotoUri(NAME, d), { ok: false, reason: call.reason });
      assert.deepEqual(log, ["visitor", "call"]);
    }
    const { d, log } = deps({ call: "throw" });
    assert.deepEqual(await fetchPhotoUri(NAME, d), { ok: false, reason: "error" });
    assert.deepEqual(log, ["visitor", "call"]);
  });

  test("Google refusing, timing out or answering with anything but its own image address: no photo", async () => {
    for (const o of [{ status: 403, body: { error: { status: "PERMISSION_DENIED" } } }, { fetchThrows: true }, { body: {} }, { body: { photoUri: "https://evil.example/x.jpg" } }]) {
      const { d } = deps(o);
      assert.deepEqual(await fetchPhotoUri(NAME, d), { ok: false, reason: "google" });
    }
  });
});
