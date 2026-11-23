import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../script.js", import.meta.url), "utf8");
const code = source.slice(source.indexOf("function continuousMenuMarkup("), source.indexOf("function chooseCategory("));
test("selecting a category never hides the following categories", () => {
  const filterCode = source.slice(source.indexOf("function filteredItems("), source.indexOf("function priceDetails("));
  const items = [{id: 1, category: "offers"}, {id: 2, category: "shawarma"}, {id: 3, category: "drinks"}];
  const result = vm.runInNewContext(filterCode + "; filteredItems();", {
    menuItems: items, state: {category: "offers", query: ""}, normalizeText: value => value
  });
  assert.equal(result.length, 3);
  assert.equal(result[2].category, "drinks");
});
function render(items, categories, language = "en") {
  const ctx = {
    menuCategories: categories.map(id => ({id})),
    escapeHTML: value => String(value).replaceAll("<", "&lt;"),
    currentCategoryLabel: id => id,
    menuCard: item => `<article data-item-id="${item.id}"></article>`,
    filteredItems: () => items,
    menuGrid: {}, emptyState: {}, clearSearch: {}, menuCount: {},
    showMore: {parentElement: {}}, state: {category: "all", query: "", visible: 12},
    menuLoadState: "ready", currentLanguage: language, renderCategories() {}
  };
  vm.runInNewContext(code + ";renderMenu();", ctx);
  return ctx;
}
test("all dishes render past the old page limit in source category order without clicks", () => {
  const items = Array.from({length: 36}, (_, id) => ({id, category: id % 2 ? "offers" : "drinks"}));
  const view = render(items, ["offers", "empty", "drinks"]);
  assert.equal((view.menuGrid.innerHTML.match(/<article /g) || []).length, 36);
  assert.equal((view.menuGrid.innerHTML.match(/menu-section-title/g) || []).length, 2);
  assert.ok(view.menuGrid.innerHTML.indexOf('data-item-id="35"') < view.menuGrid.innerHTML.indexOf('data-item-id="0"'));
  assert.equal(view.showMore.hidden, true);
  assert.equal(view.showMore.parentElement.hidden, true);
  assert.equal(view.menuCount.textContent, "Showing 36 dishes");
});
test("search results omit empty sections and preserve new categories", () => {
  const view = render([{id: 7, category: "new"}], ["offers", "drinks"], "ar");
  assert.match(view.menuGrid.innerHTML, />new<\/h3>/);
  assert.doesNotMatch(view.menuGrid.innerHTML, />offers<\/h3>/);
  assert.equal(view.menuCount.textContent, "نعرض 1 — طبقًا");
});
test("empty results show the existing empty state without section headers", () => {
  const view = render([], ["offers"]);
  assert.equal(view.menuGrid.innerHTML, "");
  assert.equal(view.menuGrid.hidden, true);
  assert.equal(view.emptyState.hidden, false);
});
