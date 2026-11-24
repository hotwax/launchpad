const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');

test('Order Manager and Products use the Maarg login address on hybrid instances', () => {
  const config = readFileSync(join(__dirname, '../.env.example'), 'utf8');
  const entry = config.split('\n').find(line => line.startsWith('VUE_APP_MAARG_LOGIN='));
  const apps = JSON.parse(entry.split('=')[1]);
  for (const app of ['order-manager', 'products']) {
    assert.ok(apps.includes(app), app + ' requires a Maarg login address');
  }
});
