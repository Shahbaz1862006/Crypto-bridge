const path = require('path');
const express = require('express');
const mock = require('./data/mockData');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));

const ROUTES = {
  ROOT: '/',
  BRIDGE: {
    VERIFY_EMAIL: '/bridge/verify-email',
    VERIFY_OTP: '/bridge/verify-otp',
    EXPLAIN: '/bridge/explain',
    PAYMENT: '/bridge/payment',
    BENEFICIARY: '/bridge/beneficiary',
    COOLING_SELECT: '/bridge/cooling-select',
    COOLING: '/bridge/cooling',
    VERIFY: '/bridge/verify',
    SUCCESS: '/bridge/success',
    EXPIRED: '/bridge/expired',
  },
  MERCHANT: {
    HOME: '/merchant',
    HISTORY: '/merchant/history',
  },
};

function render(res, view, locals = {}) {
  res.render(view, {
    ROUTES,
    page: view,
    mock,
    ...locals,
  });
}

app.get(ROUTES.ROOT, (req, res) => res.redirect(ROUTES.MERCHANT.HOME));

app.get(ROUTES.MERCHANT.HOME, (req, res) =>
  render(res, 'merchant/home', { active: 'home' })
);
app.get(ROUTES.MERCHANT.HISTORY, (req, res) =>
  render(res, 'merchant/history', { active: 'history' })
);

// Bridge flow routes – guards run client-side in JS
const BRIDGE_PAGES = [
  { path: ROUTES.BRIDGE.VERIFY_EMAIL, view: 'bridge/verify-email', step: 0, fallback: ROUTES.MERCHANT.HOME, hideStepper: true },
  { path: ROUTES.BRIDGE.VERIFY_OTP, view: 'bridge/verify-otp', step: 0, fallback: ROUTES.BRIDGE.VERIFY_EMAIL, hideStepper: true },
  { path: ROUTES.BRIDGE.EXPLAIN, view: 'bridge/explain', step: 1, fallback: ROUTES.MERCHANT.HISTORY },
  { path: ROUTES.BRIDGE.PAYMENT, view: 'bridge/payment', step: 2, fallback: ROUTES.BRIDGE.EXPLAIN },
  { path: ROUTES.BRIDGE.BENEFICIARY, view: 'bridge/beneficiary', step: 2, fallback: ROUTES.BRIDGE.PAYMENT },
  { path: ROUTES.BRIDGE.COOLING_SELECT, view: 'bridge/cooling-select', step: 2, fallback: ROUTES.BRIDGE.BENEFICIARY },
  { path: ROUTES.BRIDGE.COOLING, view: 'bridge/cooling', step: 2, fallback: ROUTES.MERCHANT.HISTORY },
  { path: ROUTES.BRIDGE.VERIFY, view: 'bridge/verify', step: 2, fallback: ROUTES.MERCHANT.HISTORY },
  { path: ROUTES.BRIDGE.EXPIRED, view: 'bridge/expired', step: 2, fallback: ROUTES.MERCHANT.HISTORY },
];

for (const cfg of BRIDGE_PAGES) {
  app.get(cfg.path, (req, res) =>
    render(res, cfg.view, {
      bridgeStep: cfg.step,
      bridgeFallback: cfg.fallback,
      hideStepper: !!cfg.hideStepper,
    })
  );
}

app.get(ROUTES.BRIDGE.SUCCESS, (req, res) => res.redirect(ROUTES.MERCHANT.HISTORY));

app.use((req, res) => res.redirect(ROUTES.MERCHANT.HOME));

app.listen(PORT, () => {
  console.log(`Fastpikeswop bridge server running at http://localhost:${PORT}`);
});
