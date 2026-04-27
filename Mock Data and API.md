# Mock Data and API — Payment Page v4 Kit

A complete reference of every screen in this project, the **mock data** it consumes, and the **APIs** it talks to. File paths are exact so you can map everything straight to the codebase.

---

## 0. The Core Idea (read this first)

This project is a **server-rendered Pug app**, not a SPA. Two things are happening:

1. **Mock data is injected by the Express route** (`routes/payment.js`) when it renders a Pug template. The data comes from one single file:

   ```js
   // routes/payment.js (lines 1-2)
   const express = require("express");
   const { payment, paymentOptions } = require("./mockData");
   ```

   So the file used by **every** screen that needs mock data is:

   ```
   routes/mockData.js   →  exports: payment, paymentOptions, symbols
   ```

2. **APIs (HTTP endpoints) are called from screens via**:
   - HTML `<form method="POST">` submissions (most of the flow), or
   - JavaScript (`assets/js/custom.js`) using `navigator.sendBeacon` / XHR (session lifecycle), or
   - A redirect-style auto-submit form (entry screen).

   All endpoints live in `routes/payment.js` under `/v2/payment/*` and `/v4/payment/*`.

---

## 1. Screen Inventory

There are **9 Pug templates** in `views/`. Of those, **8 are user-facing screens** (one is unused; three are theme dispatchers that include the real screen).

| # | Screen | Pug file | Route that renders it |
|---|---|---|---|
| 1 | Landing | `views/index.pug` | `GET /` |
| 2 | Payment Redirect (auto-POST entry) | `views/payment-redirect.pug` | `GET /:version/payment/:txId` |
| 3 | Payer Details | `views/payer_details.pug` | `GET /:version/payment/execute/payer-details` |
| 4 | Payment Page | `views/payment.pug` → `views/themes/{v2\|v4}/default.pug` | `GET\|POST /:version/payment/execute` |
| 5 | Success / TX Status | `views/tx_status.pug` → `views/themes/{v2\|v4}/tx_status.pug` | `POST /:version/payment/execute/submit` and `GET /:version/payment/execute/success` |
| 6 | Payment Failed | `views/paymentfailed.pug` → `views/themes/{v2\|v4}/payment_failed.pug` | `POST /:version/payment/execute/reject` and `GET /:version/payment/execute/failed` |
| 7 | UPI Waiting | `views/tx_waiting.pug` | `GET /:version/payment/execute/waiting` |
| 8 | Error | `views/error.pug` | `GET /:version/payment/execute/error` |
| – | _(unused)_ `views/tx_success.pug` | not wired to any route | — |

> Note: `payment.pug`, `paymentfailed.pug`, and `tx_status.pug` are not screens themselves — they are **theme dispatchers** that pick the v2 or v4 file based on `payment.theme`:
>
> ```pug
> //- views/payment.pug — dispatches to the correct theme based on payment.theme.
> //- In production, theme comes from the database (payment_page_theme).
> //- In the mock kit, it is set by the versioned route (/v2 or /v4).
> if payment.theme === 'v4'
>   include themes/v4/default.pug
> else if payment.theme === 'v2'
>   include themes/v2/default.pug
> else
>   include themes/v2/default.pug
> ```

---

## 2. Mock Data — Which Screens Use It and How

**Mock data file (single source of truth):** `routes/mockData.js`

It exports three things:
- `payment` — transaction + merchant info
- `paymentOptions` — array of 4 transfer methods (IMPS, NEFT, RTGS, UPI)
- `symbols` — currency glyphs

**How it reaches a screen:**
`routes/mockData.js` → imported in `routes/payment.js` → injected via `res.render(template, { payment, paymentOptions, ... })` → consumed in Pug as `#{payment.xxx}`.

The route also overrides two fields per version:

```js
// routes/payment.js (lines 29-35)
function getPayment() {
    return {
      ...payment,
      theme: version,
      return_url: `/${version}/payment/demo-tx-001`
    };
  }
```

### The full mock data shape (`routes/mockData.js`)

```js
const symbols = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹"
};

const payment = {
  id: "TXN-2025-00012345",
  order_num: "ORD-98765",
  merchant_name: "Demo Merchant Pvt Ltd",
  merchant_acc_name: "Demo Merchant Account",
  amount: "5,000.00",
  currency: "INR",
  description: "Order #98765 — Premium Plan",
  fc_merchant_id: "FC-DEMO-001",
  symbols,
  theme: "v2",                 // overridden per-version by the route
  page_session_id: "sess-mock-001",
  return_url: "/payment/demo-tx-001",
  payment_page_config: {
    show_transaction_details: true,
    payment_page_language: "en"
  }
};

const paymentOptions = [
  { type: "IMPS", label: "IMPS Transfer",
    options: { selected: true,  upi_link: undefined,
      bank_name: "State Bank of India", account_holder: "Demo Merchant Account",
      account_number: "1234567890123456", code: "SBIN0001234" } },
  { type: "NEFT", label: "NEFT Transfer",
    options: { selected: false, upi_link: undefined,
      bank_name: "State Bank of India", account_holder: "Demo Merchant Account",
      account_number: "1234567890123456", code: "SBIN0001234" } },
  { type: "RTGS", label: "RTGS Transfer",
    options: { selected: false, upi_link: undefined,
      bank_name: "State Bank of India", account_holder: "Demo Merchant Account",
      account_number: "1234567890123456", code: "SBIN0001234" } },
  { type: "UPI",  label: "UPI Transfer",
    options: { selected: false,
      upi_link: "upi://pay?pa=demo@upi&pn=DemoMerchant&tn=ORD-98765&am=5000.00&cu=INR",
      bank_name: "State Bank of India", account_holder: "Demo Merchant Account",
      account_number: "1234567890123456", code: "demo@upi" } }
];

module.exports = { payment, paymentOptions, symbols };
```

### Count: 6 of 8 screens consume mock data

| # | Screen | Uses mock data? | Mock data file | What it reads from `mockData.js` |
|---|---|---|---|---|
| 1 | Landing (`index.pug`) | No | — | Pure static HTML, no data injection. |
| 2 | Payment Redirect (`payment-redirect.pug`) | No | — | Uses only `params.txId` (URL) and `query.lang` (URL). |
| 3 | Payer Details (`payer_details.pug`) | Yes | `routes/mockData.js` → `payment` | `payment.id`, `payment.order_num`, `payment.amount`, `payment.currency`, `payment.symbols` |
| 4 | Payment Page (`themes/{v}/default.pug`) | Yes | `routes/mockData.js` → `payment` + `paymentOptions` | Whole `payment` object + iterates `paymentOptions` for IMPS/NEFT/RTGS/UPI cards |
| 5 | Success / TX Status (`themes/{v}/tx_status.pug`) | Yes | `routes/mockData.js` → `payment` | `payment.order_num`, `payment.amount`, `payment.currency`, `payment.symbols`, `payment.return_url` |
| 6 | Payment Failed (`themes/{v}/payment_failed.pug`) | Yes | `routes/mockData.js` → `payment` (+ derived `order_id`, `transfer_id`) and route-built `error` | `payment.order_num`/`order_id`, `payment.amount`, `payment.return_url`, `error.title`, `error.message` |
| 7 | UPI Waiting (`tx_waiting.pug`) | Yes | `routes/mockData.js` → `payment` | `payment` passed into `+payment-details(payment)` mixin |
| 8 | Error (`error.pug`) | No | — | Uses only `title` and `message` strings literally hard-coded in the route. |

### The exact code path (proof for each consumer)

**Payer Details** — `routes/payment.js`:
```js
// lines 40-43
router.get("/execute/payer-details", (req, res) => {
    if (req.query.lang) req.setLocale(req.query.lang);
    res.render("payer_details", { payment: getPayment() });
  });
```
…rendered in `views/payer_details.pug`:
```pug
//- lines 26-32
.trans-id
  span= __('transactionId')
  span.tr-id.total-pay #{payment.order_num}
.1st-page
  .p-row
    div
      .total-pay= __('totalPayment')
      .pay-rs #{payment.symbols[payment.currency] || payment.currency} #{payment.amount}
```

**Payment Page** — `routes/payment.js`:
```js
// lines 49-57
router.get("/execute", (req, res) => {
    if (req.query.lang) req.setLocale(req.query.lang);
    res.render("payment", { payment: getPayment(), paymentOptions });
  });

  router.post("/execute", (req, res) => {
    if (req.query.lang) req.setLocale(req.query.lang);
    res.render("payment", { payment: getPayment(), paymentOptions });
  });
```
…consumed in `views/themes/v2/default.pug`:
```pug
//- lines 30-36
.pay-rs #{payment.symbols[payment.currency] || payment.currency} #{payment.amount}
.options-row
  each option,index in paymentOptions
    if option.options.selected
      +payment-option-cards(payment,option,index,selected=true)
    else
      +payment-option-cards(payment,option,index)
```

**Success (TX Status)** — `routes/payment.js`:
```js
// lines 70-79
router.post("/execute/submit", (req, res) => {
    if (req.query.lang) req.setLocale(req.query.lang);
    res.render("tx_status", { payment: getPayment() });
  });

  // Convenience GET for direct testing:
  router.get("/execute/success", (req, res) => {
    if (req.query.lang) req.setLocale(req.query.lang);
    res.render("tx_status", { payment: getPayment() });
  });
```

**Payment Failed** — `routes/payment.js`:
```js
// lines 84-101
router.post("/execute/reject", (req, res) => {
    if (req.query.lang) req.setLocale(req.query.lang);
    const p = getPayment();
    res.render("paymentfailed", {
      error: { title: "Transaction Cancelled", message: "You cancelled this transaction." },
      payment: { ...p, order_id: p.order_num, transfer_id: p.id }
    });
  });

  // Convenience GET for direct testing:
  router.get("/execute/failed", (req, res) => {
    if (req.query.lang) req.setLocale(req.query.lang);
    const p = getPayment();
    res.render("paymentfailed", {
      error: null,
      payment: { ...p, order_id: p.order_num, transfer_id: p.id }
    });
  });
```

**UPI Waiting** — `routes/payment.js`:
```js
// lines 106-109
router.get("/execute/waiting", (req, res) => {
    if (req.query.lang) req.setLocale(req.query.lang);
    res.render("tx_waiting", { payment: getPayment() });
  });
```

---

## 3. APIs — Which Screens Call Them and Why

In a Pug + Express app, "API call" means one of:
- A `<form action="...">` submission (HTML-native API call)
- A JavaScript request (`sendBeacon` / `fetch` / `XHR`) from `assets/js/custom.js`
- An auto-POST redirect

There are **9 endpoints total** in `routes/payment.js`. The ones actually invoked by a screen are listed below.

### Count: 5 of 8 screens make API calls

| # | Screen | Calls API? | Endpoint(s) it hits | Why it calls them |
|---|---|---|---|---|
| 1 | Landing (`index.pug`) | No | — | Just `<a>` links — pure navigation. |
| 2 | Payment Redirect (`payment-redirect.pug`) | Yes | `POST /:v/payment/execute` | Auto-submits a hidden form on page load to bootstrap the payment flow with the `transfer_id`. |
| 3 | Payer Details (`payer_details.pug`) | Yes | `POST /:v/payment/execute/payer_details` | Submits the payer's name/phone/email/VPA so the backend can attach them to the transaction; server then redirects to the payment page. |
| 4 | Payment Page (`themes/{v}/default.pug` + protocol mixins) | Yes | `POST /:v/payment/execute/submit` (UTR/BRN submit) and `POST /:v/payment/execute/reject` (cancel) | Submits the user's transaction reference (UTR/BRN/UPI Tx ID) for verification → server renders success screen. The reject form sends a cancel reason → server renders the failed screen. |
| 5 | Success / TX Status (`themes/{v}/tx_status.pug`) | No (only navigation) | — | The "Return to website" button is just `<a href=payment.return_url>`, not an API call. |
| 6 | Payment Failed (`themes/{v}/payment_failed.pug`) | No (only navigation) | — | Same — "Return to website" is a plain link. |
| 7 | UPI Waiting (`tx_waiting.pug`) | No (client-side timer) | — | Uses `setInterval` + `sessionStorage` for the 10-min countdown; on timeout it does a `window.location` redirect to `/execute/failed`, which is a `GET` page load (not really an XHR). |
| 8 | Error (`error.pug`) | No | — | Static error message page. |
| — | (Cross-cutting via `assets/js/custom.js`, runs on every screen that extends `layouts/base.pug`) | Yes | `POST /payment/execute/session-close` (and a Socket.IO `payment-session-heartbeat` event whose HTTP fallback is `POST /payment/execute/heartbeat`) | Live session lifecycle — close the session when the tab unloads, and emit periodic heartbeats while the page is open. |

### The exact code path for each API call

**Payment Redirect → POST `/execute`**
```pug
//- views/payment-redirect.pug (lines 5-6)
form(name="redirectForm" method="POST" action=`${basePath || '/payment'}/execute${query.lang ? '?lang=' + query.lang : ''}`)
  input(type="hidden" name="transfer_id" value=params.txId)
```
Why: the entry URL `GET /:txId` lands here with only a transfer ID; the form auto-POSTs to `/execute` so the backend can look up the transaction and render the real payment page.

**Payer Details → POST `/execute/payer_details`**
```pug
//- views/payer_details.pug (lines 34-42)
form(method="POST" action=`${basePath || '/payment'}/execute/payer_details`)
  input.payer_details_input(name="name", placeholder="Name")
  input.payer_details_input(name="phone",placeholder="Phone")
  input.payer_details_input(name="email", placeholder="Email")
  input.payer_details_input(name="vpa", placeholder="VPA")
  input.payer_details_input(name="transfer_id", type="hidden" value=payment.id)
  .center-align
    button.pay-button(type="submit")= __('submit')
    button.skip_payer_details(type="submit")= __('skip')
```
Why: collects the optional payer info before the user picks a payment method; the route then redirects to `/execute`.

**Payment Page → POST `/execute/submit`** (used by all four protocol mixins and the v4 placeholder)
```pug
//- views/mixins/payment-protocols/options.pug (line 20)
form(method="POST" action=`${basePath || '/payment'}/execute/submit`)
```
```pug
//- views/mixins/payment-protocols/v2Options.pug (line 27)
form(method="POST" action=`${basePath || '/payment'}/execute/submit`)
```
```pug
//- views/themes/v4/default.pug (lines 45-46)
form(method="POST" action=`${basePath || '/payment'}/execute/submit`)
  input(type="hidden" name="transfer_id" value=payment.id)
```
Why: this is the **main payment confirmation API**. The user enters their UTR/BRN/UPI Tx ID after transferring funds; the server renders the success screen.

**Payment Page → POST `/execute/reject`** (cancel transaction)
```pug
//- views/themes/v2/default.pug (line 50)
form(id="rejectTransaction" method="POST" action=`${basePath || '/payment'}/execute/reject`)
```
```pug
//- views/themes/v4/default.pug (line 54)
form(method="POST" action=`${basePath || '/payment'}/execute/reject`)
```
Why: lets the user cancel with a reason; the server renders the failed screen with `error.title = "Transaction Cancelled"`.

**`custom.js` (loaded by `layouts/base.pug` on every theme page) → POST `/payment/execute/session-close`**
```js
// assets/js/custom.js (lines 64-78)
// Use sendBeacon for reliable delivery during unload
if (navigator.sendBeacon) {
  navigator.sendBeacon(
    "/payment/execute/session-close",
    new Blob([payload], { type: "application/json" })
  );
} else {
  // Fallback: synchronous XHR (last resort)
  try {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/payment/execute/session-close", false);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(payload);
  } catch (e) {}
}
```
Why: when the user closes the tab/browser, the script fires a "session close" so the backend can decrement its live-session counter. In the mock kit this endpoint just returns `{ ok: true }`. (Note the URL is hard-coded to `/payment/...`, which only matches in production; in the mock kit it 404s harmlessly.)

**`custom.js` heartbeat (Socket.IO, with HTTP fallback `POST /payment/execute/heartbeat`)**
```js
// assets/js/custom.js (lines 44-52)
if (typeof socket !== "undefined" && socket) {
  _heartbeatInterval = setInterval(function() {
    if (_sessionClosed) return;
    socket.emit("payment-session-heartbeat", {
      transfer_id: _transferId,
      page_session_id: _pageSessionId
    });
  }, 30000);
}
```
Why: keeps `last_alive_at` fresh on the server while the page is open; when the user's network drops, the socket dies, heartbeats stop, and the server can auto-close the session. The mock route at `POST /execute/heartbeat` just returns `{ ok: true }` for safety.

---

## 4. Endpoint-by-Endpoint Reverse Map

| Endpoint (under `/v2/payment` or `/v4/payment`) | Called by which screen | Purpose |
|---|---|---|
| `GET /:txId` | Browser (entry URL) | Renders Payment Redirect screen — uses URL params, no mock data. |
| `POST /execute` | Payment Redirect (auto-POST form) | Bootstraps the payment session and renders Payment Page with mock data. |
| `GET /execute` | Browser (direct nav / after payer-details redirect) | Renders Payment Page with mock data. |
| `GET /execute/payer-details` | Browser (direct nav) | Renders Payer Details with mock data. |
| `POST /execute/payer_details` | Payer Details form | Saves payer info → redirects to `/execute`. |
| `POST /execute/submit` | Payment Page (UTR/BRN form, all 4 protocol mixins + v4) | Confirms transaction → renders Success screen. |
| `GET /execute/success` | Browser (testing shortcut) | Renders Success screen with mock data. |
| `POST /execute/reject` | Payment Page (cancel form) | Cancels transaction → renders Failed screen with `error`. |
| `GET /execute/failed` | UPI Waiting (timer expiry redirect) + browser shortcut | Renders Failed screen with mock data and `error: null`. |
| `GET /execute/waiting` | Browser (testing) | Renders UPI Waiting with mock data. |
| `GET /execute/error` | Browser (testing) | Renders Error screen — no mock data. |
| `POST /execute/heartbeat` | `custom.js` (HTTP fallback, Socket.IO primary) | Keeps the session alive. Returns `{ ok: true }`. |
| `POST /execute/session-close` | `custom.js` on `beforeunload`/`pagehide` via `sendBeacon`/XHR | Closes the session on tab unload. Returns `{ ok: true }`. |

---

## 5. TL;DR Summary

- **Total user-facing screens:** **8** (plus 3 dispatchers and 1 unused `tx_success.pug`).
- **Screens that use mock data:** **6** — Payer Details, Payment Page, Success (TX Status), Payment Failed, UPI Waiting. (Payment Page additionally uses `paymentOptions`.) Non-consumers: Landing, Payment Redirect, Error.
- **Single mock data file used by all of them:** `routes/mockData.js` (imported in `routes/payment.js` and injected via `res.render`).
- **Screens that call APIs:** **5** — Payment Redirect (auto-POST `/execute`), Payer Details (`/execute/payer_details`), Payment Page (`/execute/submit` to confirm and `/execute/reject` to cancel), plus every screen that loads `layouts/base.pug` indirectly fires `/payment/execute/session-close` (via `custom.js` on tab unload) and the Socket.IO heartbeat with HTTP fallback `/payment/execute/heartbeat`.
- **Why those APIs exist:** to bootstrap the session, capture optional payer details, submit the user's payment reference (UTR/BRN/UPI Tx ID), allow cancellation, and maintain the live-session lifecycle so the server can detect dropped clients.
