// Server-side mock data for the Crypto-Bridge Pug views.
//
// Pattern borrowed from "Mock Data and API.md" (§2): a single CommonJS file
// exported as `mock`, imported in `server.js`, and injected into every
// res.render(...) call so Pug templates can reference `#{mock.bridge.xxx}`.
//
// This mirrors the *static* literals previously hardcoded in
// views/bridge/*.pug. The dynamic state (cooling timer, verify flow, store,
// merchant history) continues to live in public/js/mock-data.js +
// public/js/mock-api.js + public/js/store.js — those run in the browser and
// are intentionally NOT duplicated here.

const symbols = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  USDT: "USDT",
};

const upiBeneficiary = {
  name: "Rapido Gate Collections",
  bankName: "HDFC Bank",
  upiId: "rapidogate@hdfc",
};

const bankBeneficiary = {
  name: "Rapido Gate Collections",
  bankName: "HDFC Bank",
  accountNumber: "123456789012",
  ifsc: "HDFC0001234",
};

const bridge = {
  usdt: {
    amount: 60,
    unit: "USDT",
    display: "60 USDT",
  },
  inr: {
    amount: "4,980",
    currency: "INR",
    display: "₹4,980",
    displayWithCurrency: "≈ ₹4,980 INR",
  },
  upiBeneficiary,
  bankBeneficiary,
  coolingOptions: [5, 30, 60, 120, 1440],
};

const merchant = {
  name: "Fastpikeswop",
};

module.exports = {
  symbols,
  bridge,
  merchant,
};
