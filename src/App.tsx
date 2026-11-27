import { lazy, Suspense, useEffect, useState } from "react";
import { CartProvider, useCart } from "./state/cart";
import { useLoad, type State } from "./service";
import { FLAVOURS } from "./data/flavours";
import { Shop, Detail, Lab, Basket, Pack } from "./Store";
import {
  SignIn,
  Community,
  PostPage,
  Dashboard,
  OrderPage,
  Contact,
} from "./Member";
import "./store.css";
const Campaign = lazy(() => import("./Campaign"));
const links = [
  ["/shop", "Shop"],
  ["/flavors", "Flavor Lab"],
  ["/community", "Community"],
  ["/about", "Our story"],
  ["/contact", "Contact"],
];
function Site() {
  const path = location.pathname.replace(/\/$/, "") || "/",
    cart = useCart(),
    state = useLoad<State>("state"),
    [menu, setMenu] = useState(false);
  const f = FLAVOURS.find((v) => path === "/shop/" + v.id);
  const title =
    f?.name ||
    links.find(([url]) => url === path)?.[1] ||
    {
      "/": "Refresh more. Feel better.",
      "/cart": "Your cart",
      "/checkout": "Checkout",
      "/dashboard": "Your account",
      "/sign-in": "Sign in",
    }[path] ||
    (path.startsWith("/orders/")
      ? "Order details"
      : path.startsWith("/community/")
        ? "Tasting note"
        : "Page unavailable");
  useEffect(() => {
    document.title = title + " | Fizz Theory";
    const old: Record<string, string> = {
      flavours: "/shop",
      community: "/community",
      story: "/about",
      ingredients: "/about",
      ...Object.fromEntries(
        FLAVOURS.map((f) => ["flavour-" + f.id, "/shop/" + f.id]),
      ),
    };
    if (path === "/" && old[location.hash.slice(1)])
      location.replace(old[location.hash.slice(1)]);
  }, [path, title]);
  const locked = path === "/dashboard" || path.startsWith("/orders/");
  useEffect(() => {
    if (locked && state.value && !state.value.user)
      location.replace("/sign-in?next=" + encodeURIComponent(path));
  }, [locked, state.value, path]);
  function page() {
    if (path === "/")
      return (
        <Suspense fallback={<p>Opening campaign…</p>}>
          <Campaign />
        </Suspense>
      );
    if (path === "/flavors") return <Lab />;
    if (path === "/contact") return <Contact />;
    if (path === "/sign-in") return <SignIn />;
    if (path === "/about")
      return (
        <section className="sheet story">
          <h1>
            Our story<span>.</span>
          </h1>
          <div className="detail">
            <article>
              <h2>
                Fruit first.
                <br />
                Fizz follows.
              </h2>
              <p className="lede">
                Fizz Theory is a soda brand concept built around four
                expressions of fruit and sparkle.
              </p>
              <h3>Inside the can</h3>
              <p>
                The range pairs a sparkling-water base with fruit extracts, from
                orange and tangerine to raspberry and pink grapefruit. Each 12
                fl oz can takes its color from its flavor.
              </p>
              <a href="/flavors">Explore the tasting guide →</a>
            </article>
            <Pack f={FLAVOURS[1]} />
          </div>
        </section>
      );
    if (!state.value)
      return (
        <section className="sheet" role="status">
          {state.error || "Loading storefront…"}{" "}
          {state.error && <button onClick={state.reload}>Retry</button>}
        </section>
      );
    if (locked && !state.value.user) return <p>Opening sign-in…</p>;
    if (path === "/shop") return <Shop state={state.value} />;
    if (f) return <Detail f={f} state={state.value} reload={state.reload} />;
    if (path === "/cart" || path === "/checkout")
      return <Basket checkout={path === "/checkout"} state={state.value} />;
    if (path === "/community") return <Community state={state.value} />;
    if (/^\/community\/\d+$/.test(path))
      return <PostPage id={path.split("/")[2]} />;
    if (path === "/dashboard")
      return <Dashboard state={state.value} reload={state.reload} />;
    if (path.startsWith("/orders/"))
      return <OrderPage id={path.split("/")[2]} />;
    return (
      <section className="sheet">
        <h1>Page unavailable</h1>
        <a href="/shop">Visit the shop →</a>
      </section>
    );
  }
  const nav = [...links, ["/dashboard", "Account"]].map(([url, label]) => (
    <a
      key={url}
      aria-current={
        path === url || path.startsWith(url + "/") ? "page" : undefined
      }
      href={url}
    >
      {label}
    </a>
  ));
  return (
    <>
      <a className="skip" href="#content">
        Skip to content
      </a>
      <header className="mast">
        <a className="wordmark" href="/">
          fizz<i>theory</i>
        </a>
        <nav aria-label="Main navigation">{nav}</nav>
        <button
          className="menub"
          aria-expanded={menu}
          onClick={() => setMenu(!menu)}
        >
          Menu
        </button>
        <a
          href="/cart"
          className="bag"
          aria-current={path === "/cart" ? "page" : undefined}
        >
          Cart ({cart.count})
        </a>
        {menu && (
          <nav className="fly" aria-label="Mobile navigation">
            {nav}
          </nav>
        )}
      </header>
      <main id="content">{page()}</main>
      {path !== "/" && (
        <footer className="end">
          <a className="wordmark" href="/">
            fizz<i>theory</i>
          </a>
          <a href="/contact">Contact & FAQ ↗</a>
          <small>Concept storefront · Test purchases only</small>
        </footer>
      )}
    </>
  );
}
export default function App() {
  return (
    <CartProvider>
      <Site />
    </CartProvider>
  );
}
