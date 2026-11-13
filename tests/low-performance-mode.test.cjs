const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../ui/app.js'), 'utf8');
// Run the production applyLighter with a fake body, without launching Tauri.
function lowPerformanceOn({ handheld, lighter }) {
  const classes = new Set();
  const classList = { toggle: (c, on) => (on ? classes.add(c) : classes.delete(c)) };
  const S = { handheld, settings: lighter === undefined ? {} : { lighter } };
  const context = vm.createContext({ S, document: { body: { classList } } });
  vm.runInContext(source.match(/^function applyLighter\([^]*?^}/m)[0], context);
  vm.runInContext('applyLighter()', context);
  return classes.has('lighter');
}

test('a handheld that never chose keeps its animations', () => {
  assert.equal(lowPerformanceOn({ handheld: true }), false);
});

test('a PC that never chose keeps its animations', () => {
  assert.equal(lowPerformanceOn({ handheld: false }), false);
});

test('turning Low Performance Mode on stops the animations', () => {
  assert.equal(lowPerformanceOn({ handheld: false, lighter: true }), true);
});

test('the switch is in Appearance and no longer in While Playing', () => {
  const look = source.slice(source.indexOf("case 'look':"), source.indexOf("case 'plugins':"));
  const playing = source.slice(source.indexOf("case 'playing':"), source.indexOf("case 'look':"));
  assert.match(look, /sw\('lighter'/);
  assert.doesNotMatch(playing, /sw\('lighter'/);
});
