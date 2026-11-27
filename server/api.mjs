import { DatabaseSync } from "node:sqlite";
import {
  randomBytes,
  randomUUID,
  createHash,
  createHmac,
  scrypt,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const derive = promisify(scrypt);
const hash = (value) => createHash("sha256").update(value).digest("hex");
const fail = (status, message) => {
  throw Object.assign(new Error(message), { status });
};
const clean = (value, max) => {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    fail(400, "Please check the form and try again.");
  return value.trim();
};
const emailValue = (value) => {
  const email = clean(value, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    fail(400, "Enter a valid email address.");
  return email;
};
export function createApi(catalog) {
  let db;
  const ids = catalog.map((f) => f.id);
  function database() {
    if (db) return db;
    const path = resolve(process.env.FIZZ_DB || ".data/fizz.sqlite");
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    db = new DatabaseSync(path);
    db.exec(`PRAGMA journal_mode=WAL;
      CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY,email TEXT UNIQUE,name TEXT,salt TEXT,digest TEXT);
      CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,uid INTEGER,expires INTEGER);
      CREATE TABLE IF NOT EXISTS posts(id INTEGER PRIMARY KEY,uid INTEGER,body TEXT,created TEXT DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS votes(uid INTEGER PRIMARY KEY,flavor TEXT);
      CREATE TABLE IF NOT EXISTS favorites(uid INTEGER,flavor TEXT,PRIMARY KEY(uid,flavor));
      CREATE TABLE IF NOT EXISTS contact(id INTEGER PRIMARY KEY,email TEXT,body TEXT,created TEXT DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS stock(flavor TEXT PRIMARY KEY,qty INTEGER CHECK(qty>=0));
      CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY,uid INTEGER,lines TEXT,total INTEGER,status TEXT,session TEXT,url TEXT,created TEXT DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS attempts(bucket TEXT PRIMARY KEY,n INTEGER,until INTEGER);`);
    ids.forEach((id) =>
      db.prepare("INSERT OR IGNORE INTO stock VALUES (?,48)").run(id),
    );
    return db;
  }
  async function stripe(path, key, body, id) {
    const response = await fetch("https://api.stripe.com/v1/" + path, {
      method: body ? "POST" : "GET",
      headers: {
        Authorization: "Bearer " + key,
        ...(id ? { "Idempotency-Key": id } : {}),
      },
      body,
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok)
      throw Object.assign(
        new Error(
          "The payment provider could not complete this request. Try again.",
        ),
        {
          status: 502,
          definitive: [400, 401, 403, 404].includes(response.status),
        },
      );
    return response.json();
  }
  async function handle(req, res, next) {
    const path = req.url.split("?")[0];
    if (!path.startsWith("/api/")) return next();
    const send = (data, status = 200) => {
      res.writeHead(status, {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      });
      res.end(JSON.stringify(data));
    };
    try {
      database();
      const one = (sql, ...args) => db.prepare(sql).get(...args);
      const all = (sql, ...args) => db.prepare(sql).all(...args);
      const run = (sql, ...args) => db.prepare(sql).run(...args);
      function expireOrder(order, status) {
        db.exec("BEGIN IMMEDIATE");
        try {
          if (
            run(
              "UPDATE orders SET status=? WHERE id=? AND status='pending'",
              status,
              order.id,
            ).changes
          )
            JSON.parse(order.lines).forEach((line) =>
              run(
                "UPDATE stock SET qty=qty+? WHERE flavor=?",
                line.qty,
                line.id,
              ),
            );
          db.exec("COMMIT");
        } catch (error) {
          db.exec("ROLLBACK");
          throw error;
        }
      }
      if (req.method === "POST" && path === "/api/stripe/webhook") {
        const secret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!secret) fail(503, "Webhook secret required.");
        let raw = "";
        for await (const chunk of req) {
          raw += chunk;
          if (raw.length > 262144) fail(413, "Event too large.");
        }
        const signatures = (req.headers["stripe-signature"] || "").split(",");
        const stamp = signatures
          .find((part) => part.startsWith("t="))
          ?.slice(2);
        const digest = createHmac("sha256", secret)
          .update(stamp + "." + raw)
          .digest();
        if (
          !/^\d+$/.test(stamp || "") ||
          Math.abs(Date.now() / 1000 - Number(stamp)) > 300 ||
          !signatures.some(
            (part) =>
              /^v1=[a-f0-9]{64}$/.test(part) &&
              timingSafeEqual(digest, Buffer.from(part.slice(3), "hex")),
          )
        )
          fail(400, "Invalid event signature.");
        const event = JSON.parse(raw),
          session = event.data?.object;
        if (
          event.livemode === false &&
          ["checkout.session.completed", "checkout.session.expired"].includes(
            event.type,
          )
        ) {
          const order = one(
            "SELECT * FROM orders WHERE id=?",
            session.client_reference_id || "",
          );
          if (
            order &&
            (!order.session || order.session === session.id) &&
            order.status === "pending"
          ) {
            if (event.type === "checkout.session.expired")
              expireOrder(order, "expired");
            else if (
              session.payment_status === "paid" &&
              session.amount_total === order.total &&
              session.currency === "usd"
            )
              run(
                "UPDATE orders SET status='paid',session=? WHERE id=?",
                session.id,
                order.id,
              );
          }
        }
        return send({ received: true });
      }
      const token =
        /(?:^|; )fizz_session=([a-f0-9]+)/.exec(
          req.headers.cookie || "",
        )?.[1] || "";
      const user = one(
        "SELECT users.id,name,email FROM users JOIN sessions ON uid=users.id WHERE token=? AND expires>?",
        hash(token),
        Date.now(),
      );
      const auth = () => {
        if (!user) fail(401, "Sign in to continue.");
        return user.id;
      };
      const cookie = (value, age) =>
        res.setHeader(
          "Set-Cookie",
          `fizz_session=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${age}${process.env.PUBLIC_ORIGIN?.startsWith("https://") ? "; Secure" : ""}`,
        );
      let body = {};
      if (req.method === "POST") {
        if (
          req.headers.origin &&
          req.headers.origin !==
            (process.env.PUBLIC_ORIGIN || "http://" + req.headers.host)
        )
          fail(403, "Origin rejected.");
        if (!req.headers["content-type"]?.startsWith("application/json"))
          fail(415, "JSON required.");
        let raw = "";
        for await (const chunk of req) {
          raw += chunk;
          if (raw.length > 8192) fail(413, "Message too large.");
        }
        try {
          body = JSON.parse(raw);
        } catch {
          fail(400, "Invalid request.");
        }
        if (!body || typeof body !== "object") fail(400, "Invalid request.");
        const bucket = hash(req.socket.remoteAddress + " " + path);
        run("DELETE FROM attempts WHERE until<?", Date.now());
        run(
          "INSERT INTO attempts VALUES (?,1,?) ON CONFLICT(bucket) DO UPDATE SET n=n+1",
          bucket,
          Date.now() + 60000,
        );
        if (one("SELECT n FROM attempts WHERE bucket=?", bucket).n > 30)
          fail(429, "Please try again in a minute.");
      }
      const route = req.method + " " + path;
      if (route === "GET /api/state")
        return send({
          user: user || null,
          stock: Object.fromEntries(
            all("SELECT * FROM stock").map((s) => [s.flavor, s.qty]),
          ),
          favorites: user
            ? all("SELECT flavor FROM favorites WHERE uid=?", user.id).map(
                (f) => f.flavor,
              )
            : [],
        });
      if (["POST /api/register", "POST /api/login"].includes(route)) {
        const email = emailValue(body.email),
          password = body.password;
        if (
          typeof password !== "string" ||
          !password.length ||
          password.length > 200
        )
          fail(400, "Enter a valid password.");
        let record = one("SELECT * FROM users WHERE email=?", email);
        if (path.endsWith("register")) {
          if (password.length < 10)
            fail(400, "Use at least 10 characters for your password.");
          const name = clean(body.name, 60),
            salt = randomBytes(16).toString("hex"),
            digest = (await derive(password, salt, 64)).toString("hex");
          if (
            !run(
              "INSERT OR IGNORE INTO users(email,name,salt,digest) VALUES(?,?,?,?)",
              email,
              name,
              salt,
              digest,
            ).changes
          )
            fail(409, "Unable to create this account. Try signing in.");
          record = one("SELECT * FROM users WHERE email=?", email);
        } else {
          const digest = await derive(
            password,
            record?.salt || "unused-login-salt",
            64,
          );
          if (
            !record ||
            !timingSafeEqual(digest, Buffer.from(record.digest, "hex"))
          )
            fail(401, "Email or password is incorrect.");
        }
        const session = randomBytes(32).toString("hex");
        run(
          "INSERT INTO sessions VALUES(?,?,?)",
          hash(session),
          record.id,
          Date.now() + 2592000000,
        );
        cookie(session, 2592000);
        return send({ ok: true });
      }
      if (route === "POST /api/logout") {
        run("DELETE FROM sessions WHERE token=?", hash(token));
        cookie("", 0);
        return send({ ok: true });
      }
      if (route === "POST /api/profile") {
        run("UPDATE users SET name=? WHERE id=?", clean(body.name, 60), auth());
        return send({ ok: true });
      }
      if (route === "POST /api/contact") {
        run(
          "INSERT INTO contact(email,body) VALUES(?,?)",
          emailValue(body.email),
          clean(body.message, 3000),
        );
        return send({ ok: true }, 201);
      }
      if (route === "POST /api/favorite" || route === "POST /api/vote") {
        const uid = auth();
        if (!ids.includes(body.flavor)) fail(400, "Unknown flavor.");
        if (path.endsWith("vote"))
          run("INSERT OR REPLACE INTO votes VALUES(?,?)", uid, body.flavor);
        else if (body.saved === true)
          run("INSERT OR IGNORE INTO favorites VALUES(?,?)", uid, body.flavor);
        else
          run(
            "DELETE FROM favorites WHERE uid=? AND flavor=?",
            uid,
            body.flavor,
          );
        return send({ ok: true });
      }
      const posts =
        "SELECT posts.id,name,body,created FROM posts JOIN users ON uid=users.id";
      if (route === "GET /api/community")
        return send({
          posts: all(posts + " ORDER BY posts.id DESC LIMIT 100"),
          votes: all("SELECT flavor,count(*) AS n FROM votes GROUP BY flavor"),
          choice: user
            ? one("SELECT flavor FROM votes WHERE uid=?", user.id)?.flavor
            : null,
        });
      if (route.startsWith("GET /api/posts/"))
        return send(
          one(posts + " WHERE posts.id=?", path.split("/").pop()) ||
            fail(404, "Post unavailable."),
        );
      if (route === "POST /api/posts")
        return send(
          {
            id: Number(
              run(
                "INSERT INTO posts(uid,body) VALUES(?,?)",
                auth(),
                clean(body.body, 1500),
              ).lastInsertRowid,
            ),
          },
          201,
        );
      if (route === "GET /api/orders")
        return send(
          all(
            "SELECT id,total,status,created FROM orders WHERE uid=? ORDER BY rowid DESC",
            auth(),
          ),
        );
      const key = process.env.STRIPE_TEST_SECRET_KEY;
      async function reconcile(order) {
        if (order.status !== "pending" || !order.session || !key) return;
        const s = await stripe(
          "checkout/sessions/" + encodeURIComponent(order.session),
          key,
        );
        if (
          s.payment_status === "paid" &&
          s.amount_total === order.total &&
          s.currency === "usd" &&
          s.client_reference_id === order.id
        )
          run("UPDATE orders SET status='paid' WHERE id=?", order.id);
        else if (s.status === "expired") {
          expireOrder(order, "expired");
        }
      }
      if (route.startsWith("GET /api/orders/")) {
        const id = path.split("/").pop(),
          uid = auth(),
          order = one("SELECT * FROM orders WHERE id=? AND uid=?", id, uid);
        if (!order) fail(404, "Order unavailable.");
        await reconcile(order);
        return send({
          ...one(
            "SELECT id,total,status,url,created FROM orders WHERE id=?",
            id,
          ),
          lines: JSON.parse(order.lines),
        });
      }
      if (route === "POST /api/checkout") {
        const uid = auth(),
          lines = body.lines;
        if (
          !Array.isArray(lines) ||
          !lines.length ||
          lines.length > ids.length ||
          new Set(lines.map((l) => l?.id)).size !== lines.length
        )
          fail(400, "Invalid cart.");
        let total = 0;
        for (const l of lines) {
          if (
            !ids.includes(l?.id) ||
            !Number.isInteger(l.qty) ||
            l.qty < 1 ||
            l.qty > 12
          )
            fail(400, "Invalid cart quantity.");
          total +=
            Math.round(catalog.find((f) => f.id === l.id).price * 100) * l.qty;
        }
        if (!key?.startsWith("sk_test_") || !process.env.PUBLIC_ORIGIN)
          fail(
            503,
            "Test checkout is awaiting payment configuration. Your cart is saved.",
          );
        const id = clean(body.requestId, 64);
        if (!/^[a-f0-9-]{36}$/.test(id)) fail(400, "Invalid checkout request.");
        const old = one("SELECT * FROM orders WHERE id=?", id);
        if (old && (old.uid !== uid || old.lines !== JSON.stringify(lines)))
          fail(409, "Cart changed. Start checkout again.");
        if (old && (old.status !== "pending" || old.session))
          return send({ url: "/orders/" + id });
        if (!old) {
          db.exec("BEGIN IMMEDIATE");
          try {
            for (const l of lines)
              if (
                !run(
                  "UPDATE stock SET qty=qty-? WHERE flavor=? AND qty>=?",
                  l.qty,
                  l.id,
                  l.qty,
                ).changes
              )
                fail(409, "Stock changed. Please review your cart.");
            run(
              "INSERT INTO orders(id,uid,lines,total,status) VALUES(?,?,?,?,'pending')",
              id,
              uid,
              JSON.stringify(lines),
              total,
            );
            db.exec("COMMIT");
          } catch (e) {
            db.exec("ROLLBACK");
            throw e;
          }
        }
        const params = new URLSearchParams({
          mode: "payment",
          client_reference_id: id,
          success_url: process.env.PUBLIC_ORIGIN + "/orders/" + id,
          cancel_url: process.env.PUBLIC_ORIGIN + "/orders/" + id,
          "payment_method_types[0]": "card",
          "shipping_address_collection[allowed_countries][0]": "US",
        });
        lines.forEach((l, i) => {
          const f = catalog.find((f) => f.id === l.id),
            prefix = "line_items[" + i + "]";
          params.set(prefix + "[quantity]", String(l.qty));
          params.set(prefix + "[price_data][currency]", "usd");
          params.set(
            prefix + "[price_data][unit_amount]",
            String(Math.round(f.price * 100)),
          );
          params.set(prefix + "[price_data][product_data][name]", f.name);
        });
        let session;
        try {
          session = await stripe("checkout/sessions", key, params, id);
        } catch (error) {
          if (error.definitive)
            expireOrder({ id, lines: JSON.stringify(lines) }, "failed");
          throw error;
        }
        run(
          "UPDATE orders SET session=?,url=? WHERE id=?",
          session.id,
          session.url,
          id,
        );
        return send({ url: session.url });
      }
      fail(404, "Page unavailable.");
    } catch (e) {
      send(
        {
          error: e.status
            ? e.message
            : "Service unavailable. Please try again.",
        },
        e.status || 503,
      );
    }
  }
  return handle;
}

export function apiPlugin(catalog) {
  const handle = createApi(catalog);
  const setup = (server) => {
    server.middlewares.use(handle);
  };
  return {
    name: "fizz-api",
    configureServer: setup,
    configurePreviewServer: setup,
  };
}
