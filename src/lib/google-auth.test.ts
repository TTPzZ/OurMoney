import assert from "node:assert/strict";
import test from "node:test";

import { GOOGLE_AUTHORIZATION_PARAMS } from "./google-auth";

test("Google OAuth asks the user to select an account on sign in", () => {
  assert.deepEqual(GOOGLE_AUTHORIZATION_PARAMS, {
    prompt: "select_account",
  });
});
