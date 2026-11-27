import test from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { apiPlugin } from "../server/api.mjs";

test("Account permissions, checkout validation and retry safety without a payment key", async () => {
  process.env.FIZZ_DB = join(
    mkdtempSync(join(tmpdir(), "fizz-test-")),
    "store.sqlite",
  );
  process.env.PUBLIC_ORIGIN = "http://localhost:5173";
  process.env.STRIPE_WEBHOOK_SECRET = "local-signature-test";
  delete process.env.STRIPE_TEST_SECRET_KEY;
  let middleware;
  apiPlugin([
    { id: "orange", name: "Sunny Orange", price: 2.99 },
  ]).configureServer({ middlewares: { use: (fn) => (middleware = fn) } });
  async function request(path, body, cookie = "", headers = {}) {
    const req = Object.assign(
      Readable.from(body === undefined ? [] : [JSON.stringify(body)]),
      {
        url: "/api/" + path,
        method: body === undefined ? "GET" : "POST",
        headers: { cookie, "content-type": "application/json", ...headers },
        socket: { remoteAddress: "local-test" },
      },
    );
    const result = {};
    await middleware(
      req,
      {
        setHeader: (key, value) => {
          result[key] = value;
        },
        writeHead: (status) => {
          result.status = status;
        },
        end: (data) => {
          result.data = JSON.parse(data);
        },
      },
      () => assert.fail("Unknown API route"),
    );
    return result;
  }
  assert.equal((await request("orders")).status, 401);
  assert.equal((await request("posts", { body: "Denied" })).status, 401);
  assert.equal(
    (await request("contact", { email: "invalid", message: "Hello" })).status,
    400,
  );
  assert.equal(
    (await request("register", {}, "", { origin: "https://example.org" }))
      .status,
    403,
  );
  const fields = {
    name: "QA",
    email: "qa@example.com",
    password: "local-test-password",
  };
  const account = await request("register", fields);
  assert.equal(account.status, 200);
  const cookie = account["Set-Cookie"].split(";")[0];
  assert.equal((await request("register", fields)).status, 409);
  assert.equal(
    (await request("login", { ...fields, password: "incorrect" })).status,
    401,
  );
  for (const qty of [0, -1, 1.5, 13]) {
    assert.equal(
      (await request("checkout", { lines: [{ id: "orange", qty }] }, cookie))
        .status,
      400,
    );
  }
  assert.equal(
    (await request("checkout", { lines: [{ id: "orange", qty: 2 }] }, cookie))
      .status,
    503,
  );
  assert.deepEqual((await request("orders", undefined, cookie)).data, []);
  assert.equal(
    (await request("state", undefined, cookie)).data.stock.orange,
    48,
  );
  assert.equal(
    (await request("stripe/webhook", { type: "untrusted" })).status,
    400,
  );
  await request("logout", {}, cookie);
  assert.equal((await request("orders", undefined, cookie)).status, 401);
});
