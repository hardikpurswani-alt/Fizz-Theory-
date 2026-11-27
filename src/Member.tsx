import { useEffect, useState } from "react";
import { api, useLoad, useAction, type State } from "./service";
import { FLAVOURS, money } from "./data/flavours";
import { useCart } from "./state/cart";
type Post = { id: number; body: string; name: string; created: string };
type Order = {
  id: string;
  total: number;
  status: string;
  created: string;
  url?: string;
  lines: { id: string; qty: number }[];
};
function Notice({ error }: { error: string }) {
  return <p role="status">{error || "Loading…"}</p>;
}
export function SignIn() {
  const [register, setRegister] = useState(false),
    action = useAction();
  const next = new URLSearchParams(location.search).get("next") || "/dashboard";
  return (
    <section className="sheet narrow">
      <h1>
        {register ? "Join the club" : "Welcome back"}
        <span>.</span>
      </h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fields = Object.fromEntries(new FormData(e.currentTarget));
          action.run(async () => {
            await api(register ? "register" : "login", fields);
            location.replace(
              /^\/(?:dashboard|checkout|community|orders\/[a-f0-9-]+|shop\/[a-z]+)$/.test(
                next,
              )
                ? next
                : "/dashboard",
            );
          });
        }}
      >
        {register && (
          <label>
            Display name
            <input
              name="name"
              required
              maxLength={60}
              autoComplete="nickname"
            />
          </label>
        )}
        <label>
          Email
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            minLength={register ? 10 : 1}
            maxLength={200}
            autoComplete={register ? "new-password" : "current-password"}
            required
          />
        </label>
        {register && <small>Use at least 10 characters.</small>}
        <button disabled={action.busy} className="cta">
          {register ? "Create account" : "Sign in"}
        </button>
      </form>
      <button
        onClick={() => {
          setRegister(!register);
          action.setMessage("");
        }}
      >
        {register ? "Already a member? Sign in" : "New here? Create an account"}
      </button>
      <p role="status">{action.message}</p>
    </section>
  );
}
export function Community({ state }: { state: State }) {
  const data = useLoad<{
      posts: Post[];
      votes: { flavor: string; n: number }[];
      choice: string;
    }>("community"),
    action = useAction();
  return (
    <section className="sheet club">
      <h1>
        The Soda Club<span>.</span>
      </h1>
      <div className="columns">
        <article>
          <h2>Tasting notes</h2>
          {state.user ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                action.run(async () => {
                  await api("posts", Object.fromEntries(new FormData(form)));
                  form.reset();
                  data.reload();
                  action.setMessage("Your note is published.");
                });
              }}
            >
              <label>
                Share a tasting note
                <textarea name="body" required maxLength={1500} />
              </label>
              <button disabled={action.busy} className="cta">
                Publish note
              </button>
            </form>
          ) : (
            <a href="/sign-in?next=/community">Sign in to post or vote →</a>
          )}
          {data.value ? (
            data.value.posts.length ? (
              data.value.posts.map((p) => (
                <article className="note" key={p.id}>
                  <small>
                    {p.name} · {p.created.slice(0, 10)}
                  </small>
                  <p>{p.body}</p>
                  <a href={"/community/" + p.id}>Open post ↗</a>
                </article>
              ))
            ) : (
              <p>No tasting notes yet. Share the first one.</p>
            )
          ) : (
            <Notice error={data.error} />
          )}
        </article>
        <aside>
          <small>Member poll</small>
          <h2>Which can would you crack first?</h2>
          {FLAVOURS.map((f) => (
            <button
              className="poll"
              disabled={!state.user || action.busy}
              aria-pressed={data.value?.choice === f.id}
              key={f.id}
              onClick={() =>
                action.run(async () => {
                  await api("vote", { flavor: f.id });
                  data.reload();
                  action.setMessage("Vote saved.");
                })
              }
            >
              {f.name}{" "}
              <b>{data.value?.votes.find((v) => v.flavor === f.id)?.n || 0}</b>
            </button>
          ))}
        </aside>
      </div>
      <p role="status">{action.message}</p>
    </section>
  );
}
export function PostPage({ id }: { id: string }) {
  const { value: p, error } = useLoad<Post>("posts/" + id);
  return (
    <section className="sheet narrow">
      <a href="/community">← Soda Club</a>
      <h1>
        Tasting note<span>.</span>
      </h1>
      {p ? (
        <article className="note">
          <b>{p.name}</b>
          <small> · {p.created}</small>
          <p>{p.body}</p>
        </article>
      ) : (
        <Notice error={error} />
      )}
    </section>
  );
}
export function Dashboard({
  state,
  reload,
}: {
  state: State;
  reload: () => void;
}) {
  const orders = useLoad<Order[]>("orders"),
    action = useAction();
  return (
    <section className="sheet account">
      <h1>
        Your account<span>.</span>
      </h1>
      <div className="columns">
        <article>
          <nav className="pills" aria-label="Account sections">
            <a href="#orders">Orders</a>
            <a href="#favorites">Favorites</a>
            <a href="#profile">Profile</a>
          </nav>
          <h2 id="orders">Recent orders</h2>
          {orders.value ? (
            orders.value.length ? (
              orders.value.map((o) => (
                <a className="bar" key={o.id} href={"/orders/" + o.id}>
                  {o.created} · {o.status} <b>{money(o.total / 100)} ↗</b>
                </a>
              ))
            ) : (
              <p>
                No orders yet. <a href="/shop">Explore the shop →</a>
              </p>
            )
          ) : (
            <Notice error={orders.error} />
          )}
          <h2 id="favorites">Saved favorites</h2>
          {state.favorites.length ? (
            FLAVOURS.filter((f) => state.favorites.includes(f.id)).map((f) => (
              <a className="bar" key={f.id} href={"/shop/" + f.id}>
                {f.name} ↗
              </a>
            ))
          ) : (
            <p>Save a soda from its product page to see it here.</p>
          )}
        </article>
        <aside id="profile">
          <h2>Profile</h2>
          <p>{state.user?.email}</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fields = Object.fromEntries(new FormData(e.currentTarget));
              action.run(async () => {
                await api("profile", fields);
                reload();
                action.setMessage("Profile saved.");
              });
            }}
          >
            <label>
              Display name
              <input
                defaultValue={state.user?.name}
                name="name"
                required
                maxLength={60}
              />
            </label>
            <button disabled={action.busy} className="cta">
              Save profile
            </button>
          </form>
          <button
            disabled={action.busy}
            onClick={() =>
              action.run(async () => {
                await api("logout", {});
                location.replace("/");
              })
            }
          >
            Sign out
          </button>
          <p role="status">{action.message}</p>
        </aside>
      </div>
    </section>
  );
}
export function OrderPage({ id }: { id: string }) {
  const { value: o, error } = useLoad<Order>("orders/" + id),
    cart = useCart();
  useEffect(() => {
    if (
      o &&
      ["expired", "failed"].includes(o.status) &&
      JSON.parse(sessionStorage.getItem("fizz-checkout") || "null")
        ?.requestId === id
    )
      sessionStorage.removeItem("fizz-checkout");
    if (
      o?.status === "paid" &&
      JSON.parse(sessionStorage.getItem("fizz-checkout") || "null")
        ?.requestId === id
    ) {
      sessionStorage.removeItem("fizz-checkout");
      for (const line of o.lines) {
        const item = cart.items.find((i) => i.flavour.id === line.id);
        if (item) cart.setQty(item.flavour.id, item.qty - line.qty);
      }
    }
  }, [o, id, cart]);
  return (
    <section className="sheet narrow">
      <a href="/dashboard">← Your account</a>
      <h1>
        {o?.status === "paid" ? "Order confirmed" : "Order details"}
        <span>.</span>
      </h1>
      {o ? (
        <>
          <p>
            Payment status · <b>{o.status}</b>
          </p>
          {o.lines.map((l) => (
            <p className="bar" key={l.id}>
              {FLAVOURS.find((f) => f.id === l.id)?.name} × {l.qty}
            </p>
          ))}
          <h2>{money(o.total / 100)}</h2>
          {o.status !== "paid" && (
            <p>
              <a href="/checkout">Back to checkout →</a>
            </p>
          )}
          {o.status === "pending" && o.url && (
            <a className="cta" href={o.url}>
              Resume payment →
            </a>
          )}
        </>
      ) : (
        <Notice error={error} />
      )}
    </section>
  );
}
export function Contact() {
  const action = useAction();
  return (
    <section className="sheet">
      <h1>
        Drop us a line<span>.</span>
      </h1>
      <div className="columns">
        <article>
          <h2>Common questions</h2>
          {[
            [
              "Which packs are available?",
              "All four flavors come as individual 12 fl oz cans.",
            ],
            [
              "Where is my order?",
              "Open your account and select an order to see its payment status.",
            ],
            [
              "Does this shop ship soda?",
              "Fizz Theory is a concept storefront. Test purchases do not ship.",
            ],
          ].map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </article>
        <aside>
          <h2>Contact the team</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              action.run(async () => {
                await api("contact", Object.fromEntries(new FormData(form)));
                form.reset();
                action.setMessage("Your message has been received.");
              });
            }}
          >
            <label>
              Email
              <input required name="email" type="email" />
            </label>
            <label>
              Message
              <textarea required name="message" maxLength={3000} />
            </label>
            <button className="cta" disabled={action.busy}>
              Send message
            </button>
          </form>
          <p role="status">{action.message}</p>
        </aside>
      </div>
    </section>
  );
}
