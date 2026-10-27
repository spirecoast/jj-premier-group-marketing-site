import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deployEnv, isPreviewDeployment, previewEmailTo, sideEffectsAllowed } from "./deploy-env";

describe("deployEnv", () => {
  it("reads Vercel's environment, server or browser side", () => {
    assert.equal(deployEnv({ VERCEL_ENV: "production" }), "production");
    assert.equal(deployEnv({ VERCEL_ENV: "preview" }), "preview");
    assert.equal(deployEnv({ NEXT_PUBLIC_VERCEL_ENV: "preview" }), "preview");
    assert.equal(deployEnv({ VERCEL_ENV: "development" }), "development");
    assert.equal(deployEnv({}), "local");
  });
  it("treats a custom Vercel environment as a preview", () => {
    assert.equal(deployEnv({ VERCEL_ENV: "staging" }), "preview");
  });
});

describe("sideEffectsAllowed", () => {
  it("is on in production and off on any other Vercel deployment", () => {
    assert.equal(sideEffectsAllowed({ VERCEL_ENV: "production" }), true);
    assert.equal(sideEffectsAllowed({ VERCEL_ENV: "preview" }), false);
    assert.equal(sideEffectsAllowed({ VERCEL_ENV: "development" }), false);
    assert.equal(isPreviewDeployment({ VERCEL_ENV: "preview" }), true);
    assert.equal(isPreviewDeployment({ VERCEL_ENV: "production" }), false);
  });
  it("leaves a local run to its keys, as before", () => {
    assert.equal(sideEffectsAllowed({ NODE_ENV: "production" }), true);
    assert.equal(sideEffectsAllowed({ NODE_ENV: "development" }), true);
  });
});

describe("previewEmailTo", () => {
  it("is the one test inbox on a preview, and nothing in production", () => {
    assert.equal(previewEmailTo({ VERCEL_ENV: "preview", PREVIEW_EMAIL_TO: " qa@example.com " }), "qa@example.com");
    assert.equal(previewEmailTo({ VERCEL_ENV: "production", PREVIEW_EMAIL_TO: "qa@example.com" }), null);
    assert.equal(previewEmailTo({ PREVIEW_EMAIL_TO: "qa@example.com" }), null);
  });
  it("refuses anything but a single address", () => {
    assert.equal(previewEmailTo({ VERCEL_ENV: "preview" }), null);
    assert.equal(previewEmailTo({ VERCEL_ENV: "preview", PREVIEW_EMAIL_TO: "a@example.com,b@example.com" }), null);
    assert.equal(previewEmailTo({ VERCEL_ENV: "preview", PREVIEW_EMAIL_TO: "not an address" }), null);
  });
});
