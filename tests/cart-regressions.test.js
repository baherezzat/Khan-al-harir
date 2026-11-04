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

function storage() {
  const data = new Map();
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value),
    removeItem: key => data.delete(key) };
}
test("cart is scoped to the tab while customer details persist in the browser", () => {
  const localStorage = storage();
  const sessionStorage = storage();
  const globals = {localStorage, sessionStorage, CUSTOMER_STORAGE_KEY: "customer", CART_STORAGE_KEY: "cart", cart: [validLine]};
  localStorage.setItem("customer", JSON.stringify({name: "Customer"}));
  const code = functionSource("readStoredJSON", "cartQuantity");
  run(code + "; saveCart()", globals);
  assert.equal(localStorage.getItem("cart"), null);
  assert.ok(sessionStorage.getItem("cart"));
  assert.equal(run(code + '; readStoredJSON("customer", {}).name', globals), "Customer");
  assert.equal(run(code + '; readStoredJSON("cart", []).length', {...globals, sessionStorage: storage()}), 0);
});
test("handoff clears cart and order notes while retaining customer details and message retry link", () => {
  const localStorage = storage(), sessionStorage = storage();
  const nodes = { confirmAccuracy: {checked: true}, orderReview: {replaceChildren() {}},
    whatsappOrderLink: {}, successOrderNumber: {}, checkoutSuccess: {hidden: true} };
  const notes = [{value: "no salt"}, {value: "extra sauce"}];
  let opened;
  const globals = {
    localStorage, sessionStorage, CUSTOMER_STORAGE_KEY: "customer", CART_STORAGE_KEY: "cart",
    cart: [validLine], checkoutStep: 4, currentLanguage: "en", RESTAURANT_WHATSAPP: "201050714404",
    checkoutNext: {}, confirmError: {}, cartFoot: {}, renderCart() {},
    customerData: () => ({name: "Customer", phone: "01012345678", orderNote: notes[0].value}),
    document: {getElementById: id => nodes[id], querySelectorAll: selector => selector === ".checkout-panel" ? [] : notes},
    isRestaurantOpenNow: () => true, createOrderNumber: () => "TEST",
    buildWhatsAppMessage: () => "2 chicken orders",
    window: {open: url => {opened = url;}}
  };
  sessionStorage.setItem("cart", JSON.stringify([validLine]));
  const code = functionSource("saveCustomerDraft", "validEgyptianPhone") +
    functionSource("confirmOrder", "updateFulfilmentFields");
  run(code + "; confirmOrder()", globals);
  assert.equal(globals.cart.length, 0);
  assert.equal(sessionStorage.getItem("cart"), null);
  assert.equal(JSON.parse(localStorage.getItem("customer")).phone, "01012345678");
  assert.equal(JSON.parse(localStorage.getItem("customer")).orderNote, undefined);
  assert.ok(notes.every(note => note.value === ""));
  assert.equal(nodes.confirmAccuracy.checked, false);
  assert.equal(nodes.whatsappOrderLink.href, opened);
  assert.ok(opened.includes(encodeURIComponent("2 chicken orders")));
  assert.equal(nodes.checkoutSuccess.hidden, false);
});
