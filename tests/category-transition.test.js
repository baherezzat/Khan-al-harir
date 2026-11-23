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
test('automatic return starts at section end and blocks competing scroll only during animation', () => {
  const listeners = {}, timers = new Map(), frames = [];
  let timerId = 0;
  const end = source.indexOf('function chooseCategory(', source.indexOf('let categoryTransitionUntil ='));
  const fullCode = source.slice(source.indexOf('let categoryTransitionUntil ='), end);
  const context = {
    window: {scrollY: 1000, innerHeight:800, addEventListener(type, fn) {listeners[type]=fn;}},
    document: {addEventListener(type, fn) {listeners[type]=fn;}, documentElement:{classList:{add(){},remove(){}}},
      querySelector: selector => selector === 'dialog[open]' ? null : {getBoundingClientRect:()=>({top:-500})}},
    siteHeader:{getBoundingClientRect:()=>({height:100})},
    menuGrid:{hidden:false,lastElementChild:{getBoundingClientRect:()=>({bottom:600})}},
    state:{query:''}, nextMenuCategory:()=> 'shawarma',
    performance:{now:()=>0}, prefersReducedMotion:{matches:false},
    requestAnimationFrame:fn=>frames.push(fn),
    setTimeout(fn) {timers.set(++timerId,fn);return timerId;}, clearTimeout:id=>timers.delete(id)
  };
  vm.runInNewContext(fullCode,context);
  let blocked = 0;
  listeners.touchmove({cancelable:true,preventDefault(){blocked++;}});
  assert.equal(blocked,0,'normal scrolling remains available');
  context.window.scrollY=1100; listeners.scroll();
  assert.equal(frames.length,1,'start immediately at end without waiting for touch release');
  listeners.touchmove({cancelable:true,preventDefault(){blocked++;}});
  assert.equal(blocked,1,'touch scroll cannot fight the return');
  vm.runInContext('cancelCategoryTransition();',context);
  listeners.touchmove({cancelable:true,preventDefault(){blocked++;}});
  assert.equal(blocked,1,'scrolling restored after cancellation');
});
test('scroll reaches the top before changing category and reduced motion still works', () => {
  for (const reduced of [false, true]) {
    const queue = [], events = [];
    const context = {
      window: {scrollY: 2000, scrollTo({top}) {this.scrollY = top; events.push(['scroll', top]);}},
      document: {documentElement: {classList: {add() {}, remove() {}}}, addEventListener() {}, querySelector: () => ({getBoundingClientRect: () => ({top: -1500})})},
      clearTimeout() {},
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
      queue.shift()(1800);
    }
    const changed = events.findIndex(event => event[0] === 'category');
    assert.deepEqual(events[changed - 1], ['scroll', 388]);
    assert.deepEqual(events[changed], ['category', 'shawarma']);
    events.length = 0;
    vm.runInContext('goToMenuCategory("drinks");cancelCategoryTransition();', context);
    queue.shift()(650);
    assert.equal(events.length, 0, 'cancelled transition must not change scroll or category');
  }
});
