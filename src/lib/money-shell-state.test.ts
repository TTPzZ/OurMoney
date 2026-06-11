import assert from "node:assert/strict";
import test from "node:test";

import {
  getDashboardPath,
  getGroupPath,
  getMoneyViewFromPathname,
} from "./money-shell-state";

test("maps dashboard paths to the dashboard shell view", () => {
  assert.deepEqual(getMoneyViewFromPathname("/dashboard"), {
    view: "dashboard",
    selectedGroupId: null,
  });
  assert.deepEqual(getMoneyViewFromPathname("/profile"), {
    view: "dashboard",
    selectedGroupId: null,
  });
});

test("maps group paths to the group shell view", () => {
  assert.deepEqual(getMoneyViewFromPathname("/group/abc123"), {
    view: "group",
    selectedGroupId: "abc123",
  });
  assert.deepEqual(getMoneyViewFromPathname("/group/abc123/add-bill"), {
    view: "group",
    selectedGroupId: "abc123",
  });
});

test("builds shell history paths", () => {
  assert.equal(getDashboardPath(), "/dashboard");
  assert.equal(getGroupPath("abc123"), "/group/abc123");
});
