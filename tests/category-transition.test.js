import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source = readFileSync(new URL('../script.js', import.meta.url), 'utf8');
test('first load starts with offers and refresh preserves manually selected all dishes', () => {
  const selectionCode = source.slice(source.indexOf('function defaultMenuCategory('), source.indexOf('function wait('));
  const context = {
    state: {category:'all',visible:12,defaultCategoryPending:true}, PAGE_SIZE:12,
    menuCategories:[], menuItems:[], categoryLabels:{}, categoryLabelsAr:{}, lastMenuSignature:'', menuLoadState:'loading',
    officialMenuSignature:()=>'',
    categories:[{id:'shawarma',label:'Shawarma'},{id:'offers',ar:'عروض'},{id:'drinks',label:'Drinks'}],
    items:[{category:'shawarma'},{category:'offers'},{category:'drinks'}]
  };
  vm.createContext(context);
  vm.runInContext(selectionCode+'; applyOfficialMenu(categories, items, {preserveView:true});', context);
  assert.equal(context.state.category,'offers');
  context.state.category='all';
  vm.runInContext('applyOfficialMenu(categories, items, {preserveView:true});', context);
  assert.equal(context.state.category,'all');
});
const code = source.slice(source.indexOf('let categoryTransitionUntil ='), source.indexOf('window.addEventListener("scroll", () => {', source.indexOf('let categoryTransitionUntil =')));
test('scroll reaches the top before changing category and reduced motion still works', () => {
  for (const reduced of [false, true]) {
    const queue = [], events = [];
    const context = {
      window: {scrollY: 2000, scrollTo({top}) {this.scrollY = top; events.push(['scroll', top]);}},
      document: {querySelector: () => ({getBoundingClientRect: () => ({top: -1500})})},
      siteHeader: {getBoundingClientRect: () => ({height: 100})},
      categoryFilters: {querySelector: () => null}, prefersReducedMotion: {matches: reduced},
      performance: {now: () => 0}, requestAnimationFrame: fn => queue.push(fn),
      state: {query: ''}, menuSearch: {}, chooseCategory: id => events.push(['category', id])
    };
    vm.runInNewContext(code + ';goToMenuCategory("shawarma");', context);
    assert.equal(events.length, 0);
    queue.shift()(100);
    if (!reduced) {
      assert.equal(events.some(event => event[0] === 'category'), false);
      queue.shift()(650);
    }
    const changed = events.findIndex(event => event[0] === 'category');
    assert.deepEqual(events[changed - 1], ['scroll', 388]);
    assert.deepEqual(events[changed], ['category', 'shawarma']);
  }
});
