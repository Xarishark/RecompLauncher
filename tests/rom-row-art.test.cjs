const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const app = fs.readFileSync(path.join(__dirname, '../ui/app.js'), 'utf8');
const fn = (src, name) => src.match(new RegExp(`^function ${name}\\([^]*?^}`, 'm'))[0];

function ctx() {
  const c = vm.createContext({});
  vm.runInContext(`${app.match(/^const ART_KINDS = .*$/m)[0]}\n${fn(app, 'gameArt')}\n${fn(app, 'romRowArt')}`, c);
  return c;
}

// A recomp as the launcher holds it once it shows its project's cover: the game's own is kept
// under _cov (applyCover).
const SHOWING_PROJECT = { id: 'r', cover: '/project.jpg', _cov: '/game.jpg', icon: '/game-icon.png' };

test('a ROM row shows the game\'s box art, not the project cover its recomp shows', () => {
  const c = ctx();
  c.recs = [SHOWING_PROJECT];
  assert.deepEqual({ ...vm.runInContext('romRowArt(recs)', c) }, { url: '/game.jpg', box: true });
});

test('a ROM row with no box art shows the game\'s icon', () => {
  const c = ctx();
  c.recs = [{ id: 'r', cover: '', icon: '/game-icon.png' }];
  assert.deepEqual({ ...vm.runInContext('romRowArt(recs)', c) }, { url: '/game-icon.png', box: false });
});

test('a ROM row takes the box art from whichever recomp of the game has one', () => {
  const c = ctx();
  c.recs = [{ id: 'a', cover: '' }, { id: 'b', cover: '/b.jpg' }];
  assert.equal(vm.runInContext('romRowArt(recs).url', c), '/b.jpg');
});

test('a ROM row with no art at all has none', () => {
  const c = ctx();
  c.recs = [{ id: 'r' }];
  assert.equal(vm.runInContext('romRowArt(recs).url', c), '');
});
