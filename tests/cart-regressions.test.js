import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";
import assert from "node:assert/strict";

const source = readFileSync(new URL("../script.js", import.meta.url), "utf8");
function functionSource(name, next) {
  return source.slice(source.indexOf("function " + name + "("), source.indexOf("function " + next + "("));
}
function run(code, globals = {}) {
  return vm.runInNewContext(code, globals);
}
const sanitization = functionSource("sanitizeCart", "readStoredJSON");
const phone = functionSource("validEgyptianPhone", "validateDetails");
const validLine = {
  signature: "dish-1", name: "Chicken", arabic: "دجاج", image: "/assets/chicken.jpg",
  unitPrice: 125, quantity: 2, selections: [], note: "No salt"
};

test("valid saved carts retain their items, prices and quantities", () => {
  const result = run(sanitization + "; sanitizeCart(input)", { input: [validLine] });
  assert.equal(JSON.stringify(result), JSON.stringify([validLine]));
});
test("malformed stored cart entries cannot crash cart rendering", () => {
  const input = [null, 5, {}, {...validLine, selections: [null]},
    {...validLine, quantity: -1}, {...validLine, unitPrice: NaN}, validLine];
  assert.equal(run(sanitization + "; sanitizeCart(input).length", {input}), 1);
  assert.equal(run(sanitization + "; sanitizeCart({}).length"), 0);
});
test("Egyptian phone validation accepts local, international and Arabic digits", () => {
  for (const value of ["01012345678", "+20 1012345678", "00201012345678", "٠١٠١٢٣٤٥٦٧٨", "۰۱۰۱۲۳۴۵۶۷۸"]) {
    assert.equal(run(phone + "; validEgyptianPhone(value)", {value}), true, value);
  }
  for (const value of ["", "12345", "01912345678", "010123456789"]) {
    assert.equal(run(phone + "; validEgyptianPhone(value)", {value}), false, value);
  }
});

function addHarness(checked, required = true, oldLine = null) {
  let focused = false;
  let closed = false;
  const globals = {
    menuItems: [{id: 1, name: "Chicken", arabic: "دجاج", image: "/chicken.jpg",
      customizationGroups: [{required}]}],
    menuDetailItemId: 1, currentLanguage: "en",
    menuDetailOptions: {querySelectorAll: selector => selector === "input:checked" ? checked :
      [{querySelector: () => ({focus: () => {focused = true;}})}]},
    menuDetailPriceLabel: {}, menuItemNote: {value: ""},
    collectSelection: () => ({selections: [], unitPrice: 150}),
    cart: oldLine ? [oldLine] : [],
    saveCart() {}, renderCart() {}, openCart() {},
    menuDetail: {close: () => {closed = true;}},
    window: {setTimeout() {}}
  };
  run(functionSource("addCurrentItemToCart", "cartLineMarkup") + "; addCurrentItemToCart()", globals);
  return {globals, focused, closed};
}
test("required multiple-choice additions block submission until selected", () => {
  const result = addHarness([]);
  assert.equal(result.globals.cart.length, 0);
  assert.equal(result.focused, true);
  assert.equal(result.closed, false);
});
test("selected required options and optional groups allow adding to cart", () => {
  assert.equal(addHarness([{dataset: {groupIndex: "0"}, value: "extra"}]).globals.cart.length, 1);
  assert.equal(addHarness([], false).globals.cart.length, 1);
});
test("re-adding a dish after its price changes updates its existing cart line", () => {
  const old = {...validLine, signature: JSON.stringify([1, [], ""]), quantity: 2, unitPrice: 100};
  const result = addHarness([], false, old);
  assert.equal(result.globals.cart.length, 1);
  assert.equal(result.globals.cart[0].quantity, 3);
  assert.equal(result.globals.cart[0].unitPrice, 150);
});
test("saved fulfilment selector is restricted to the two supported values", () => {
  assert.ok(source.includes('["pickup", "delivery"].includes(savedCustomer.fulfilment)'));
});
