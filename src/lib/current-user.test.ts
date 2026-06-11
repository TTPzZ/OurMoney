import assert from "node:assert/strict";
import test from "node:test";

import {
  buildExistingGoogleUserPatch,
  getGroupDetailCachePredicate,
  getPublicUserImage,
  toPublicUser,
} from "./current-user";

test("existing Google users keep custom name and image on sign in", () => {
  const patch = buildExistingGoogleUserPatch(
    {
      email: "custom@example.com",
      googleId: "google-1",
      googleName: "Old Google Name",
      googleImage: "old-google-avatar",
      customName: "Custom Name",
      customImage: "custom-avatar",
    },
    {
      email: "google@example.com",
      googleId: "google-1",
      name: "Google Name",
      image: "google-avatar",
    },
  );

  assert.deepEqual(patch, {
    googleName: "Google Name",
    googleImage: "google-avatar",
  });
});

test("existing Google user patch only fills missing safe identity fields", () => {
  const patch = buildExistingGoogleUserPatch(
    {
      customName: "Custom Name",
      customImage: "custom-avatar",
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
    googleName: "Google Name",
    googleImage: "google-avatar",
  });
});

test("base64 avatars are exposed through the avatar route", () => {
  assert.equal(
    getPublicUserImage("user-1", "data:image/png;base64,abc", 123),
    "/api/user/avatar?userId=user-1&v=123",
  );
  assert.equal(getPublicUserImage("user-1", "https://example.com/a.png", 123), "https://example.com/a.png");
});

test("public user prefers custom profile and exposes reset state", () => {
  const user = toPublicUser({
    _id: "user-1",
    email: "user@example.com",
    googleName: "Google Name",
    googleImage: "google-avatar",
    customName: "Custom Name",
    customImage: "data:image/gif;base64,abc",
    updatedAt: 123,
  });

  assert.deepEqual(user, {
    _id: "user-1",
    email: "user@example.com",
    name: "Custom Name",
    image: "/api/user/avatar?userId=user-1&v=123",
    customName: "Custom Name",
    customImage: "/api/user/avatar?userId=user-1&v=123",
    googleName: "Google Name",
    googleImage: "google-avatar",
  });
});

test("public user falls back to Google profile when custom profile is reset", () => {
  const user = toPublicUser({
    _id: "user-1",
    email: "user@example.com",
    googleName: "Google Name",
    googleImage: "google-avatar",
    customName: null,
    customImage: null,
  });

  assert.equal(user.name, "Google Name");
  assert.equal(user.image, "google-avatar");
  assert.equal(user.customName, undefined);
  assert.equal(user.customImage, undefined);
});

test("group detail cache predicate only targets individual group keys", () => {
  const predicate = getGroupDetailCachePredicate();

  assert.equal(predicate("/api/groups/abc"), true);
  assert.equal(predicate("/api/groups"), false);
  assert.equal(predicate("/api/me"), false);
  assert.equal(predicate(["/api/groups/abc"]), false);
});
