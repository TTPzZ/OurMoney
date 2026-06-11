import assert from "node:assert/strict";
import test from "node:test";

import {
  buildExistingGoogleUserPatch,
  getGroupDetailCachePredicate,
  getPublicUserImage,
} from "./current-user";

test("existing Google users keep custom name and image on sign in", () => {
  const patch = buildExistingGoogleUserPatch(
    {
      email: "custom@example.com",
      googleId: "google-1",
      name: "Custom Name",
      image: "custom-avatar",
    },
    {
      email: "google@example.com",
      googleId: "google-1",
      name: "Google Name",
      image: "google-avatar",
    },
  );

  assert.deepEqual(patch, {});
});

test("existing Google user patch only fills missing safe identity fields", () => {
  const patch = buildExistingGoogleUserPatch(
    {
      name: "Custom Name",
      image: "custom-avatar",
    },
    {
      email: "google@example.com",
      googleId: "google-1",
      name: "Google Name",
      image: "google-avatar",
    },
  );

  assert.deepEqual(patch, {
    email: "google@example.com",
    googleId: "google-1",
  });
});

test("base64 avatars are exposed through the avatar route", () => {
  assert.equal(
    getPublicUserImage("user-1", "data:image/png;base64,abc", 123),
    "/api/user/avatar?userId=user-1&v=123",
  );
  assert.equal(getPublicUserImage("user-1", "https://example.com/a.png", 123), "https://example.com/a.png");
});

test("group detail cache predicate only targets individual group keys", () => {
  const predicate = getGroupDetailCachePredicate();

  assert.equal(predicate("/api/groups/abc"), true);
  assert.equal(predicate("/api/groups"), false);
  assert.equal(predicate("/api/me"), false);
  assert.equal(predicate(["/api/groups/abc"]), false);
});
