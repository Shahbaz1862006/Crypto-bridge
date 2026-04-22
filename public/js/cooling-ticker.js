import { actions } from './store.js';

setInterval(() => { actions.tickCooling(); }, 1000);
