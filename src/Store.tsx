import { useState } from "react";
import { FLAVOURS, money, type Flavour } from "./data/flavours";
import { FlatCan } from "./components/FlatCan";
import { FruitSlice } from "./components/Fruit";
import { useCart } from "./state/cart";
import { api, useAction, type State } from "./service";
export const product = (f: Flavour) => "/shop/" + f.id;
export function Pack({ f }: { f: Flavour }) {
  return (
    <div className="pack" style={{ background: f.card }}>
      <div className="disc" style={{ background: f.hero }} />
      <FruitSlice kind={f.fruit} size={88} className="slice" />
      <FlatCan flavour={f} className="pack-can" label={f.name + " can"} />
    </div>
  );
}
export function Shop({ state }: { state: State }) {
  const [filter, setFilter] = useState("all");
  return (
    <section className="sheet">
      <h1>
        The soda shop<span>.</span>
      </h1>
      <div className="bar">
        <p>Single cans · 12 fl oz</p>
        <label>
          Flavor{" "}
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All flavors</option>
            {FLAVOURS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="shelf">
        {FLAVOURS.filter((f) => filter === "all" || filter === f.id).map(
          (f) => (
            <a className="item" href={product(f)} key={f.id}>
              <Pack f={f} />
              <small>{state.stock[f.id] > 0 ? "Available" : "Sold out"}</small>
              <h2>{f.name}</h2>
              <strong>
                {money(f.price)} <span aria-hidden="true">↗</span>
              </strong>
            </a>
          ),
        )}
      </div>
    </section>
  );
}
export function Detail({
  f,
  state,
  reload,
}: {
  f: Flavour;
  state: State;
  reload: () => void;
}) {
  const cart = useCart(),
    action = useAction(),
    [qty, setQty] = useState(1);
  const inCart = cart.items.find((i) => i.flavour.id === f.id)?.qty || 0,
    limit = Math.max(0, Math.min(state.stock[f.id], 12) - inCart),
    saved = state.favorites.includes(f.id);
  return (
    <section className="sheet detail">
      <Pack f={f} />
      <div>
        <a href="/shop">← All sodas</a>
        <h1>{f.name}</h1>
        <p className="lede">{f.description}</p>
        <hr />
        <p>Single can · 12 fl oz · {money(f.price)}</p>
        <label>
          Quantity{" "}
          <select
            value={Math.min(qty, limit)}
            disabled={!limit}
            onChange={(e) => setQty(Number(e.target.value))}
          >
            {Array.from({ length: limit }, (_, i) => (
              <option key={i}>{i + 1}</option>
            ))}
          </select>
        </label>{" "}
        <button
          className="cta"
          disabled={!limit}
          onClick={() => {
            cart.setQty(f.id, inCart + Math.min(qty, limit));
            action.setMessage("Added to your cart.");
          }}
        >
          {!state.stock[f.id]
            ? "Sold out"
            : !limit
              ? "Cart limit reached"
              : "Add to cart"}
        </button>
        <p role="status">{action.message}</p>
        <div className="bar">
          <a href="/cart">View cart →</a>
          <button
            disabled={action.busy}
            onClick={() =>
              state.user
                ? action.run(async () => {
                    await api("favorite", { flavor: f.id, saved: !saved });
                    reload();
                  })
                : location.assign("/sign-in?next=" + product(f))
            }
          >
            {saved ? "♥ Saved" : "♡ Save favorite"}
          </button>
        </div>
        <details>
          <summary>Ingredients & tasting notes</summary>
          <p>
            {f.description} The concept recipe uses sparkling water and fruit
            extracts. A verified ingredient label is unavailable.
          </p>
        </details>
      </div>
    </section>
  );
}
export function Lab() {
  const [f, setF] = useState(FLAVOURS[0]);
  return (
    <section className="sheet lab" style={{ background: f.card }}>
      <h1>
        Flavor Lab<span>.</span>
      </h1>
      <div className="pills">
        {FLAVOURS.map((v) => (
          <button
            key={v.id}
            aria-pressed={v.id === f.id}
            onClick={() => setF(v)}
          >
            {v.name}
          </button>
        ))}
      </div>
      <div className="detail" key={f.id}>
        <Pack f={f} />
        <article>
          <small>Tasting profile</small>
          <h2>{f.name}</h2>
          <p className="lede">{f.description}</p>
          <a className="cta" href={product(f)}>
            Shop this flavor ↗
          </a>
        </article>
      </div>
    </section>
  );
}
export function Basket({
  checkout,
  state,
}: {
  checkout: boolean;
  state: State;
}) {
  const cart = useCart(),
    action = useAction();
  async function pay() {
    const lines = cart.items.map((i) => ({ id: i.flavour.id, qty: i.qty })),
      signature = JSON.stringify([state.user?.id, lines]);
    const previous = JSON.parse(
      sessionStorage.getItem("fizz-checkout") || "null",
    );
    const requestId =
      previous?.signature === signature
        ? previous.requestId
        : crypto.randomUUID();
    sessionStorage.setItem(
      "fizz-checkout",
      JSON.stringify({ signature, requestId }),
    );
    location.assign(
      (await api<{ url: string }>("checkout", { lines, requestId })).url,
    );
  }
  return (
    <section className="sheet narrow">
      <h1>
        {checkout ? "Checkout" : "Your cart"}
        <span>.</span>
      </h1>
      {!cart.count ? (
        <>
          <p>Your cart is empty.</p>
          <a className="cta" href="/shop">
            Explore the shop →
          </a>
        </>
      ) : (
        <>
          <p>
            {checkout
              ? "Review your cans before continuing to hosted test payment."
              : "Your selection of single cans."}
          </p>
          {cart.items.map(({ flavour: f, qty }) => (
            <div className="cartrow" key={f.id}>
              <FlatCan flavour={f} className="mini" />
              <div>
                <a href={product(f)}>
                  <b>{f.name}</b>
                </a>
                <p>
                  {money(f.price)} × {qty}
                </p>
              </div>
              {!checkout && (
                <div>
                  <label>
                    Qty{" "}
                    <select
                      value={qty}
                      onChange={(e) =>
                        cart.setQty(f.id, Number(e.target.value))
                      }
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i}>{i + 1}</option>
                      ))}
                    </select>
                  </label>
                  <button onClick={() => cart.setQty(f.id, 0)}>Remove</button>
                </div>
              )}
              <b>{money(f.price * qty)}</b>
            </div>
          ))}
          <div className="bar">
            <h2>Subtotal</h2>
            <h2>{money(cart.subtotal)}</h2>
          </div>
          {checkout ? (
            state.user ? (
              <button
                className="cta"
                disabled={action.busy}
                onClick={() => action.run(pay)}
              >
                Continue to payment →
              </button>
            ) : (
              <a className="cta" href="/sign-in?next=/checkout">
                Sign in to check out →
              </a>
            )
          ) : (
            <a className="cta" href="/checkout">
              Checkout →
            </a>
          )}
          <p role="status">{action.message}</p>
        </>
      )}
    </section>
  );
}
