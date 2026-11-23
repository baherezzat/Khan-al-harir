import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source = readFileSync(new URL('../script.js', import.meta.url), 'utf8');
test('search finds Arabic and English dishes outside the selected category; clearing restores category', () => {
 const ctx={state:{category:'offers',query:''},menuItems:[{name:'Offer',arabic:'عرض',category:'offers'},{name:'Lentil Soup',arabic:'شوربة عدس',category:'soup'}],arabicMenuDescriptions:{},categoryLabels:{},categoryLabelsAr:{}};
 vm.createContext(ctx);
 vm.runInContext(source.slice(source.indexOf('function normalizeText('),source.indexOf('function priceDetails(')),ctx);
 assert.equal(vm.runInContext('filteredItems()[0].category',ctx),'offers');
 for(const query of ['عدس','LENTIL']) {ctx.state.query=query;assert.equal(vm.runInContext('filteredItems()[0].category',ctx),'soup');}
 ctx.state.query='';assert.equal(vm.runInContext('filteredItems().length',ctx),1);
});
test('manual category selection cancels animation and changes synchronously', () => {
 const calls=[];
 const ctx={state:{query:'soup'},menuSearch:{value:'soup'},cancelCategoryTransition:()=>calls.push('cancel'),chooseCategory:category=>calls.push(category)};
 vm.runInNewContext(source.slice(source.indexOf('function selectMenuCategory('),source.indexOf('function goToMenuCategory('))+';selectMenuCategory("soup");',ctx);
 assert.deepEqual(calls,['cancel','soup']);assert.equal(ctx.state.query,'');assert.equal(ctx.menuSearch.value,'');
});
test('typing cancels any pending automatic return before rendering search', () => {
 const calls=[],ctx={menuSearch:{value:'عدس',addEventListener:(event,fn)=>fn()},state:{},PAGE_SIZE:12,cancelCategoryTransition:()=>calls.push('cancel'),renderMenu:()=>calls.push('render')};
 vm.runInNewContext(source.slice(source.indexOf('menuSearch.addEventListener("input"'),source.indexOf('clearSearch.addEventListener("click"')),ctx);
 assert.deepEqual(calls,['cancel','render']);assert.equal(ctx.state.query,'عدس');
});
