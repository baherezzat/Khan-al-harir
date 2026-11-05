import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import handler from "../api/menu.js";

const source = readFileSync(new URL("../script.js", import.meta.url), "utf8");
const signatureCode = source.slice(source.indexOf("function officialMenuSignature("), source.indexOf("function updateMenuSourceMessage("));
const signature = (items, categories) => vm.runInNewContext(signatureCode + "; officialMenuSignature(items, categories)", {items, categories});
const item = {id:"1",name:"Chicken",arabic:"دجاج",price:100,priceOptions:[],customizationGroups:[]};
const categories = [{id:"grills",label:"Grills",ar:"مشاوي"}];
test("refresh detects changed prices, names, additions, removals and new categories", () => {
  const baseline = signature([item], categories);
  for (const changed of [{...item,price:120},{...item,name:"New name"},{...item,descriptionAr:"وصف جديد"}]) {
    assert.notEqual(signature([changed], categories), baseline);
  }
  assert.notEqual(signature([item,{...item,id:"2"}], categories), baseline);
  assert.notEqual(signature([], categories), baseline);
  assert.notEqual(signature([item],[...categories,{id:"new",label:"New"}]),baseline);
  assert.notEqual(signature([item],[{...categories[0],ar:"قسم جديد"}]),baseline);
});

function response() {
  return {headers:{}, setHeader(key,value){this.headers[key]=value;},
    status(code){this.code=code;return this;},json(data){this.body=data;return this;}};
}
test("proxy discovers new source categories and returns their current products automatically", async () => {
  const original = global.fetch;
  let generation = 0;
  const fetched = [];
  global.fetch = async (url, options) => {
    fetched.push(url);
    assert.ok(options.signal);
    assert.equal(options.cache, "no-store");
    const data = url.endsWith("/categories")
      ? [{id:1}, ...(generation ? [{id:2}] : [])]
      : url.endsWith("khan-al-harir") ? {id:33}
      : {products:[{id:url.includes("/2/") ? 20 : 10,price:generation ? 150 : 100}]};
    return {ok:true,json:async()=>({status:true,data})};
  };
  try {
    const first=response(); await handler({method:"GET"},first);
    generation=1;
    const second=response(); await handler({method:"GET"},second);
    assert.equal(first.body.data.categories[0].products[0].price,100);
    assert.equal(second.body.data.categories.length,2);
    assert.equal(second.body.data.categories[0].products[0].price,150);
    assert.ok(fetched.some(url=>url.includes("/categories/2/products")));
    assert.equal(second.headers["Cache-Control"],"public, max-age=0, s-maxage=60, must-revalidate");
  } finally {global.fetch=original;}
});
test("malformed product data is marked unavailable and never cached as an empty menu", async () => {
  const original=global.fetch;
  global.fetch=async url=>({ok:true,json:async()=>({status:true,data:
    url.endsWith("/categories") ? [{id:1}] : {id:33}})});
  try {
    const result=response(); await handler({method:"GET"},result);
    assert.equal(result.headers["Cache-Control"],"no-store");
    assert.equal(result.body.data.failedCategoryCount,1);
    assert.equal(result.body.data.categories[0].productsUnavailable,true);
  } finally {global.fetch=original;}
});
test("partial updates preserve the displayed menu and enable the retry notice", async () => {
  const start=source.indexOf("async function loadOfficialMenu(");
  const end=source.indexOf("function refreshOfficialMenuIfStale(");
  let applied=false;
  const globals={
    menuRefreshInFlight:false,menuSource:{apiBase:"test",branchId:33},
    lastMenuRefreshAt:0,menuItems:[item],menuSyncUnavailable:false,
    readOfficialMenuCache:()=>null,fetchOfficialMenuBundle:async()=>({
      categories:[{id:1,title:{en:"Grills"},productsUnavailable:true}]}),
    applyOfficialBranchInfo(){}, categorySlug:()=> "grills",
    failedCategoryCount:0, applyOfficialMenu(){applied=true;},
    updateMenuSourceMessage(){},console:{warn(){},error(){}}
  };
  await vm.runInNewContext(source.slice(start,end) + "; loadOfficialMenu()",globals);
  assert.equal(applied,false);
  assert.equal(globals.menuItems[0],item);
  assert.equal(globals.menuSyncUnavailable,true);
  assert.equal(globals.menuRefreshInFlight,false);
});
test("proxy rejects non-GET requests", async () => {
  const result=response(); await handler({method:"POST"},result);
  assert.equal(result.code,405);
});
