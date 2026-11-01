"use strict";

/*
  KHAN AL HARIR — OFFICIAL QR MENU
  --------------------------------
  Current categories, dishes, images, and EGP prices load from the restaurant's
  public QR menu. The legacy list below is retained only as a photography reference.
*/
const PAGE_SIZE = 12;
const MENU_REFRESH_INTERVAL_MS = 2 * 60 * 1000;
const MENU_REFRESH_MIN_GAP_MS = 30 * 1000;

let menuCategories = [
  { id: "offers", label: "Offers", ar: "العروض" },
  { id: "shawarma-sandwiches", label: "Shawarma sandwiches", ar: "ساندوتش شاورما" },
  { id: "shawarma-meals", label: "Shawarma meals", ar: "وجبات شاورما" },
  { id: "western-meals", label: "Western meals", ar: "وجبات الغربي" },
  { id: "western-sandwiches", label: "Western sandwiches", ar: "ساندوتش غربي" },
  { id: "burgers", label: "Burgers", ar: "برجر" },
  { id: "broasted", label: "Broasted chicken", ar: "دجاج بروستد" },
  { id: "shawaya", label: "Shawaya chicken", ar: "دجاج شواية" },
  { id: "charcoal-chicken", label: "Charcoal-grilled chicken", ar: "فراخ مشوية على الفحم" },
  { id: "casseroles", label: "Casseroles", ar: "طواجن" },
  { id: "meat-grills", label: "Meat grills", ar: "مشويات اللحوم" },
  { id: "grilled-sandwiches", label: "Grilled sandwiches", ar: "ساندوتش مشاوي" },
  { id: "grilled-meals", label: "Grilled meals", ar: "وجبات مشاوي" },
  { id: "trays", label: "Trays", ar: "صواني" },
  { id: "addons", label: "Add-ons", ar: "إضافات" },
  { id: "pies", label: "Pies", ar: "فطائر" },
  { id: "appetizers", label: "Appetizers", ar: "المقبلات" },
  { id: "soups", label: "Soups", ar: "الشوربات" },
  { id: "desserts", label: "Desserts", ar: "الحلويات" },
  { id: "drinks", label: "Cold drinks", ar: "المشروبات الباردة" }
];

const legacyMenuItems = [
  // Offers
  { id: "offer-arabi", name: "Arabi Offer", arabic: "عرض عربي", category: "offers", description: "A published restaurant offer.", price: null, image: "assets/menu/offer-arabi.webp" },
  { id: "offer-maria", name: "Maria Offer", arabic: "عرض ماريا", category: "offers", description: "A published restaurant offer.", price: null, image: "assets/menu/offer-maria.webp" },
  { id: "offer-fatta", name: "Fatta Offer", arabic: "عرض فتة", category: "offers", description: "A published restaurant offer.", price: null, image: "assets/menu/offer-fatta.webp" },
  { id: "offer-burgers", name: "Burger Offer", arabic: "عرض برجر", category: "offers", description: "A published restaurant offer.", price: null, image: "assets/menu/offer-burgers.webp" },
  { id: "offer-family", name: "Family Offer", arabic: "عرض عائلي", category: "offers", description: "A published restaurant offer.", price: null, image: "assets/menu/offer-family.webp" },
  { id: "offer-khan-box", name: "Khan Box Offer", arabic: "عرض خان بوكس", category: "offers", description: "A published restaurant offer.", price: null, image: "assets/menu/offer-khan-box.webp" },
  { id: "offer-broast-leg", name: "Broasted Leg Offer", arabic: "عرض بروستد أوراك", category: "offers", description: "A published restaurant offer.", price: null, image: "assets/menu/offer-broast-leg.webp" },
  { id: "offer-broast-breast", name: "Broasted Breast Offer", arabic: "عرض بروستد صدور", category: "offers", description: "A published restaurant offer.", price: null, image: "assets/menu/offer-broast-breast.webp" },

  // Shawarma
  { id: "shawarma-arabi", name: "Shawarma Arabi", arabic: "شاورما عربي", category: "shawarma", description: "Shawarma Arabi from the published restaurant menu.", price: null, image: "assets/menu/shawarma-arabi.webp" },
  { id: "shawarma-saj", name: "Shawarma Saj", arabic: "شاورما صاج", category: "shawarma", description: "Shawarma saj from the published restaurant menu.", price: null, image: "assets/menu/shawarma-saj.webp" },
  { id: "shawarma-kaiser", name: "Shawarma Kaiser", arabic: "شاورما كايزر", category: "shawarma", description: "Shawarma kaiser from the published restaurant menu.", price: null, image: "assets/menu/shawarma-kaiser.webp" },
  { id: "shawarma-french", name: "Shawarma French", arabic: "شاورما فرنساوي", category: "shawarma", description: "French-style shawarma from the published menu.", price: null, image: "assets/menu/shawarma-french.webp" },
  { id: "shawarma-falafel", name: "Shawarma Falafel", arabic: "شاورما فلافل", category: "shawarma", description: "Shawarma falafel from the published restaurant menu.", price: null, image: "assets/menu/shawarma-falafel.webp" },
  { id: "shawarma-fatta", name: "Shawarma Fatta", arabic: "فتة شاورما", category: "shawarma", description: "Shawarma fatta from the published restaurant menu.", price: null, image: "assets/menu/shawarma-fatta.webp" },
  { id: "shawarma-extra", name: "Shawarma Extra", arabic: "شاورما اكسترا", category: "shawarma", description: "Shawarma Extra from the published restaurant menu.", price: null, image: "assets/menu/shawarma-extra.webp" },
  { id: "shawarma-extra-meal", name: "Shawarma Extra Meal", arabic: "وجبة شاورما اكسترا", category: "shawarma", description: "A shawarma meal from the published restaurant menu.", price: null, image: "assets/menu/shawarma-extra-meal.webp" },
  { id: "shawarma-extra-fatta", name: "Shawarma Extra Fatta", arabic: "فتة شاورما اكسترا", category: "shawarma", description: "Shawarma Extra fatta from the published menu.", price: null, image: "assets/menu/shawarma-extra-fatta.webp" },
  { id: "shawarma-extra-food", name: "Shawarma Extra Food", arabic: "شاورما اكسترا فود", category: "shawarma", description: "Shawarma Extra Food from the published menu.", price: null, image: "assets/menu/shawarma-extra-food.webp" },
  { id: "shawarma-double", name: "Double Shawarma", arabic: "شاورما دبل", category: "shawarma", description: "Double shawarma from the published restaurant menu.", price: null, image: "assets/menu/shawarma-double.webp" },
  { id: "quarter-kilo-shawarma", name: "Quarter Kilo Shawarma", arabic: "ربع كيلو شاورما", category: "shawarma", description: "Quarter-kilo shawarma as named on the published menu.", price: null, image: "assets/menu/quarter-kilo.webp" },
  { id: "half-kilo-shawarma", name: "Half Kilo Shawarma", arabic: "نصف كيلو شاورما", category: "shawarma", description: "Half-kilo shawarma as named on the published menu.", price: null, image: "assets/menu/half-kilo.webp" },
  { id: "kilo-shawarma", name: "Kilo Shawarma", arabic: "كيلو شاورما", category: "shawarma", description: "Kilo shawarma as named on the published menu.", price: null, image: "assets/menu/kilo-shawarma.webp" },
  { id: "shawarma-cake", name: "Shawarma Cake", arabic: "تورتة شاورما", category: "shawarma", description: "Shawarma cake from the published restaurant menu.", price: null, image: "assets/menu/shawarma-cake.webp" },
  { id: "maria", name: "Maria", arabic: "ماريا", category: "shawarma", description: "Maria from the published shawarma selection.", price: null, image: "assets/menu/maria.webp" },
  { id: "maria-cheese", name: "Maria Cheese", arabic: "ماريا بالجبنة", category: "shawarma", description: "Maria with cheese from the published menu.", price: null, image: "assets/menu/maria-cheese.webp" },
  { id: "maria-charcoal", name: "Maria Charcoal", arabic: "ماريا على الفحم", category: "shawarma", description: "Maria Charcoal from the published restaurant menu.", price: null, image: "assets/menu/maria-charcoal.webp" },

  // Appetizers
  { id: "hummus", name: "Hummus", arabic: "حمص", category: "appetizers", description: "Hummus from the published appetizer selection.", price: null, image: "assets/menu/hummus.webp" },
  { id: "hummus-beiruti", name: "Hummus Beiruti", arabic: "حمص بيروتي", category: "appetizers", description: "Hummus Beiruti from the published appetizer menu.", price: null, image: "assets/menu/hummus-beiruti.webp" },
  { id: "hummus-meat", name: "Hummus with Meat", arabic: "حمص باللحمة", category: "appetizers", description: "Hummus with meat, as listed on the published menu.", price: null, image: "assets/menu/hummus-meat.webp" },
  { id: "hummus-chicken", name: "Hummus with Chicken", arabic: "حمص بالفراخ", category: "appetizers", description: "Hummus with chicken, as listed on the published menu.", price: null, image: "assets/menu/hummus-chicken.webp" },
  { id: "hummus-beef-shawarma", name: "Hummus with Beef Shawarma", arabic: "حمص بشاورما اللحمة", category: "appetizers", description: "Hummus with beef shawarma from the published menu.", price: null, image: "assets/menu/hummus-beef-shawarma.webp" },
  { id: "mutabbal", name: "Mutabbal", arabic: "متبل", category: "appetizers", description: "Mutabbal from the published appetizer selection.", price: null, image: "assets/menu/mutabbal.webp" },
  { id: "baba-ganoush", name: "Baba Ganoush", arabic: "بابا غنوج", category: "appetizers", description: "Baba ganoush from the published appetizer menu.", price: null, image: "assets/menu/baba-ganoush.webp" },
  { id: "muhammara", name: "Muhammara", arabic: "محمرة", category: "appetizers", description: "Muhammara from the published appetizer selection.", price: null, image: "assets/menu/muhammara.webp" },
  { id: "fried-kibbeh", name: "Fried Kibbeh", arabic: "كبة مقلية", category: "appetizers", description: "Fried kibbeh from the published appetizer menu.", price: null, image: "assets/menu/fried-kibbeh.webp" },
  { id: "raw-kibbeh", name: "Raw Kibbeh", arabic: "كبة نية", category: "appetizers", description: "Raw kibbeh from the published appetizer menu.", price: null, image: "assets/menu/raw-kibbeh.webp" },

  // Sides and bread
  { id: "fries", name: "Fries", arabic: "بطاطس", category: "sides", description: "Fries from the published side-dish selection.", price: null, image: "assets/menu/fries.webp" },
  { id: "cheddar-fries", name: "Cheddar Fries", arabic: "بطاطس بالشيدر", category: "sides", description: "Cheddar fries from the published side-dish menu.", price: null, image: "assets/menu/cheddar-fries.webp" },
  { id: "rice", name: "Rice", arabic: "أرز", category: "sides", description: "Rice from the published side-dish selection.", price: null, image: "assets/menu/rice.webp" },
  { id: "rice-nuts", name: "Rice with Nuts", arabic: "أرز بالمكسرات", category: "sides", description: "Rice with nuts, as listed on the published menu.", price: null, image: "assets/menu/rice-nuts.webp" },
  { id: "coleslaw", name: "Coleslaw", arabic: "كول سلو", category: "sides", description: "Coleslaw from the published side-dish selection.", price: null, image: "assets/menu/coleslaw.webp" },
  { id: "garlic-sauce", name: "Garlic Sauce", arabic: "ثوم", category: "sides", description: "Garlic sauce from the published side-dish menu.", price: null, image: "assets/menu/garlic-sauce.webp" },
  { id: "spicy-garlic", name: "Spicy Garlic Sauce", arabic: "ثوم حار", category: "sides", description: "Spicy garlic sauce from the published menu.", price: null, image: "assets/menu/spicy-garlic.webp" },
  { id: "mayonnaise", name: "Mayonnaise", arabic: "مايونيز", category: "sides", description: "Mayonnaise from the published side-dish menu.", price: null, image: "assets/menu/mayonnaise.webp" },
  { id: "tahina", name: "Tahina", arabic: "طحينة", category: "sides", description: "Tahina from the published side-dish selection.", price: null, image: "assets/menu/tahina.webp" },
  { id: "pickles", name: "Pickles", arabic: "مخلل", category: "sides", description: "Pickles from the published side-dish selection.", price: null, image: "assets/menu/pickles.webp" },
  { id: "daqous", name: "Daqous", arabic: "دقوس", category: "sides", description: "Daqous from the published side-dish selection.", price: null, image: "assets/menu/daqous.webp" },
  { id: "yogurt-cucumber", name: "Yogurt with Cucumber", arabic: "زبادي بالخيار", category: "sides", description: "Yogurt with cucumber from the published menu.", price: null, image: "assets/menu/yogurt-cucumber.webp" },
  { id: "bread-bag", name: "Bread Bag", arabic: "كيس خبز", category: "sides", description: "A bread bag as named on the published menu.", price: null, image: "assets/menu/bread-bag.webp" },
  { id: "saj-bread", name: "Saj Bread", arabic: "خبز صاج", category: "sides", description: "Saj bread from the published bread selection.", price: null, image: "assets/menu/saj-bread.webp" },
  { id: "oven-bread", name: "Oven Bread", arabic: "خبز فرن", category: "sides", description: "Oven bread from the published bread selection.", price: null, image: "assets/menu/oven-bread.webp" },
  { id: "toasted-bread", name: "Toasted Bread", arabic: "خبز محمص", category: "sides", description: "Toasted bread from the published bread selection.", price: null, image: "assets/menu/toasted-bread.webp" },
  { id: "grilled-muhammara-bread", name: "Grilled Muhammara Bread", arabic: "خبز محمرة مشوي", category: "sides", description: "Grilled muhammara bread from the published menu.", price: null, image: "assets/menu/grilled-muhammara-bread.webp" },
  { id: "cheese-borak", name: "Cheese Borak", arabic: "بوراك جبنة", category: "sides", description: "Cheese borak from the published restaurant menu.", price: null, image: "assets/menu/cheese-borak.webp" },
  { id: "meat-borak", name: "Meat Borak", arabic: "بوراك لحمة", category: "sides", description: "Meat borak from the published restaurant menu.", price: null, image: "assets/menu/meat-borak.webp" },
  { id: "vine-leaves", name: "Vine Leaves", arabic: "ورق عنب", category: "sides", description: "Vine leaves from the published restaurant menu.", price: null, image: "assets/menu/vine-leaves.webp" },

  // Soups
  { id: "lentil-soup", name: "Lentil Soup", arabic: "شوربة عدس", category: "soups", description: "Lentil soup from the published soup selection.", price: null, image: "assets/menu/lentil-soup.webp" },
  { id: "orzo-soup", name: "Orzo Soup", arabic: "شوربة لسان عصفور", category: "soups", description: "Orzo soup from the published soup selection.", price: null, image: "assets/menu/orzo-soup.webp" },
  { id: "plain-cream-soup", name: "Plain Cream Soup", arabic: "شوربة كريمة سادة", category: "soups", description: "Plain cream soup from the published soup selection.", price: null, image: "assets/cream-soup-illustrative.webp", illustrative: true },
  { id: "chicken-cream-soup", name: "Chicken Cream Soup", arabic: "شوربة كريمة بالفراخ", category: "soups", description: "Chicken cream soup from the published soup selection.", price: null, image: "assets/cream-soup-illustrative.webp", illustrative: true },
  { id: "chicken-mushroom-cream-soup", name: "Chicken and Mushroom Cream Soup", arabic: "شوربة كريمة بالفراخ والمشروم", category: "soups", description: "Chicken and mushroom cream soup from the published menu.", price: null, image: "assets/cream-soup-illustrative.webp", illustrative: true },
  { id: "mushroom-cream-soup", name: "Mushroom Cream Soup", arabic: "شوربة كريمة بالمشروم", category: "soups", description: "Mushroom cream soup from the published soup selection.", price: null, image: "assets/cream-soup-illustrative.webp", illustrative: true },

  // Salads
  { id: "fattoush", name: "Fattoush", arabic: "فتوش", category: "salads", description: "Fattoush from the published salad selection.", price: null, image: "assets/menu/fattoush.webp" },
  { id: "tabbouleh", name: "Tabbouleh", arabic: "تبولة", category: "salads", description: "Tabbouleh from the published salad selection.", price: null, image: "assets/menu/tabbouleh.webp" },
  { id: "green-salad", name: "Green Salad", arabic: "سلطة خضراء", category: "salads", description: "Green salad from the published salad selection.", price: null, image: "assets/menu/green-salad.webp" },
  { id: "arugula-salad", name: "Arugula Salad", arabic: "سلطة جرجير", category: "salads", description: "Arugula salad from the published salad selection.", price: null, image: "assets/menu/arugula-salad.webp" },
  { id: "caesar-salad", name: "Caesar Salad", arabic: "سلطة سيزر", category: "salads", description: "Caesar salad from the published salad selection.", price: null, image: "assets/menu/caesar-salad.webp" },
  { id: "grilled-salad", name: "Grilled Salad", arabic: "سلطة مشوية", category: "salads", description: "Grilled salad from the published salad selection.", price: null, image: "assets/menu/grilled-salad.webp" },

  // Grills and family trays
  { id: "meat-kofta", name: "Meat Kofta", arabic: "كفتة لحم", category: "grills", description: "Meat kofta from the published grill selection.", price: null, image: "assets/menu/meat-kofta.webp" },
  { id: "chicken-kofta", name: "Chicken Kofta", arabic: "كفتة فراخ", category: "grills", description: "Chicken kofta from the published grill selection.", price: null, image: "assets/menu/chicken-kofta.webp" },
  { id: "kebab", name: "Kebab", arabic: "كباب", category: "grills", description: "Kebab from the published grill selection.", price: null, image: "assets/menu/kebab.webp" },
  { id: "grilled-kibbeh", name: "Grilled Kibbeh", arabic: "كبة مشوية", category: "grills", description: "Grilled kibbeh from the published grill menu.", price: null, image: "assets/menu/grilled-kibbeh.webp" },
  { id: "kibbeh-skewer", name: "Kibbeh Skewer", arabic: "سيخ كبة", category: "grills", description: "Kibbeh skewer from the published grill selection.", price: null, image: "assets/menu/kibbeh-skewer.webp" },
  { id: "eggplant-kofta", name: "Eggplant Kofta", arabic: "كفتة بالباذنجان", category: "grills", description: "Eggplant kofta from the published grill menu.", price: null, image: "assets/menu/eggplant-kofta.webp" },
  { id: "izmirli-kofta", name: "Izmirli Kofta", arabic: "كفتة ازميرلي", category: "grills", description: "Izmirli kofta from the published grill menu.", price: null, image: "assets/menu/izmirli-kofta.webp" },
  { id: "khashkhash-kofta", name: "Khashkhash Kofta", arabic: "كفتة خشخاش", category: "grills", description: "Khashkhash kofta from the published grill menu.", price: null, image: "assets/menu/khashkhash-kofta.webp" },
  { id: "grilled-lamb-chops", name: "Grilled Lamb Chops", arabic: "ريش ضاني مشوية", category: "grills", description: "Grilled lamb chops from the published grill menu.", price: null, image: "assets/menu/grilled-lamb-chops.webp" },
  { id: "grilled-lamb-slices", name: "Grilled Lamb Slices", arabic: "شرحات غنم مشوية", category: "grills", description: "Grilled lamb slices from the published grill menu.", price: null, image: "assets/menu/grilled-lamb-slices.webp" },
  { id: "grilled-makhasi", name: "Grilled Makhasi", arabic: "مخاصي مشوية", category: "grills", description: "Grilled makhasi from the published grill menu.", price: null, image: "assets/menu/grilled-makhasi.webp" },
  { id: "grilled-kawali", name: "Grilled Kawali", arabic: "كوالي مشوية", category: "grills", description: "Grilled kawali from the published grill menu.", price: null, image: "assets/menu/grilled-kawali.webp" },
  { id: "sujuk", name: "Sujuk", arabic: "سجق", category: "grills", description: "Sujuk from the published grill selection.", price: null, image: "assets/menu/sujuk.webp" },
  { id: "liver", name: "Liver", arabic: "كبدة", category: "grills", description: "Liver from the published grill selection.", price: null, image: "assets/menu/liver.webp" },
  { id: "heart", name: "Heart", arabic: "قلب", category: "grills", description: "Heart from the published grill selection.", price: null, image: "assets/menu/heart.webp" },
  { id: "mixed-grill", name: "Mixed Grill", arabic: "مشاوي مشكلة", category: "grills", description: "Mixed grill from the published grill selection.", price: null, image: "assets/menu/mixed-grill.webp" },
  { id: "kofta-meal", name: "Kofta Meal", arabic: "وجبة كفتة", category: "grills", description: "A kofta meal from the published restaurant menu.", price: null, image: "assets/menu/kofta-meal.webp" },
  { id: "kebab-meal", name: "Kebab Meal", arabic: "وجبة كباب", category: "grills", description: "A kebab meal from the published restaurant menu.", price: null, image: "assets/menu/kebab-meal.webp" },
  { id: "kebab-meal-2", name: "Kebab Meal 2", arabic: "وجبة كباب 2", category: "grills", description: "A published kebab meal selection.", price: null, image: "assets/menu/kebab-meal-2.webp" },
  { id: "shish-kofta-meal", name: "Shish and Kofta Meal", arabic: "وجبة شيش وكفتة", category: "grills", description: "A shish and kofta meal from the published menu.", price: null, image: "assets/menu/shish-kofta-meal.webp" },
  { id: "mixed-grill-meal-3", name: "Mixed Grill Meal 3", arabic: "وجبة مشاوي مشكلة 3", category: "grills", description: "A published mixed-grill meal.", price: null, image: "assets/menu/mixed-grill-meal-3.webp" },
  { id: "mixed-grill-meal-4", name: "Mixed Grill Meal 4", arabic: "وجبة مشاوي مشكلة 4", category: "grills", description: "A published mixed-grill meal.", price: null, image: "assets/menu/mixed-grill-meal-4.webp" },
  { id: "friends-tray", name: "Friends Tray", arabic: "صينية الأصدقاء", category: "grills", description: "Friends Tray from the published family-tray selection.", price: null, image: "assets/menu/friends-tray.webp" },
  { id: "khan-tray", name: "Khan Tray", arabic: "صينية خان", category: "grills", description: "Khan Tray from the published family-tray selection.", price: null, image: "assets/menu/khan-tray.webp" },
  { id: "mansaf-leg", name: "Mansaf Leg", arabic: "منسف فخذة", category: "grills", description: "Mansaf leg from the published family-tray selection.", price: null, image: "assets/menu/mansaf-leg.webp" },
  { id: "mansaf-shoulder", name: "Mansaf Shoulder", arabic: "منسف كتف", category: "grills", description: "Mansaf shoulder from the published family-tray menu.", price: null, image: "assets/menu/mansaf-shoulder.webp" },
  { id: "izmirli-meal", name: "Izmirli Meal", arabic: "وجبة ازميرلي", category: "grills", description: "An Izmirli meal from the published restaurant menu.", price: null, image: "assets/menu/izmirli-meal.webp" },

  // Grilled and Western sandwiches and burgers
  { id: "kofta-sandwich", name: "Kofta Sandwich", arabic: "ساندوتش كفتة", category: "sandwiches", description: "A kofta sandwich from the published menu.", price: null, image: "assets/menu/kofta-sandwich.webp" },
  { id: "chicken-kofta-sandwich", name: "Chicken Kofta Sandwich", arabic: "ساندوتش كفتة فراخ", category: "sandwiches", description: "A chicken kofta sandwich from the published menu.", price: null, image: "assets/menu/chicken-kofta-sandwich.webp" },
  { id: "kebab-sandwich", name: "Kebab Sandwich", arabic: "ساندوتش كباب", category: "sandwiches", description: "A kebab sandwich from the published menu.", price: null, image: "assets/menu/kebab-sandwich.webp" },
  { id: "shish-sandwich", name: "Shish Sandwich", arabic: "ساندوتش شيش", category: "sandwiches", description: "A shish sandwich from the published menu.", price: null, image: "assets/menu/shish-sandwich.webp" },
  { id: "shish-extra-sandwich", name: "Shish Extra Sandwich", arabic: "ساندوتش شيش اكسترا", category: "sandwiches", description: "A Shish Extra sandwich from the published menu.", price: null, image: "assets/menu/shish-extra-sandwich.webp" },
  { id: "izmirli-sandwich", name: "Izmirli Sandwich", arabic: "ساندوتش ازميرلي", category: "sandwiches", description: "An Izmirli sandwich from the published menu.", price: null, image: "assets/menu/izmirli-sandwich.webp" },
  { id: "maajouqa-meal", name: "Maajouqa Meal", arabic: "وجبة معجوقة", category: "sandwiches", description: "A Maajouqa meal from the published restaurant menu.", price: null, image: "assets/menu/maajouqa-meal.webp" },
  { id: "sujuk-sandwich", name: "Sujuk Sandwich", arabic: "ساندوتش سجق", category: "sandwiches", description: "A sujuk sandwich from the published menu.", price: null, image: "assets/menu/sujuk-sandwich.webp" },
  { id: "liver-sandwich", name: "Liver Sandwich", arabic: "ساندوتش كبدة", category: "sandwiches", description: "A liver sandwich from the published menu.", price: null, image: "assets/menu/liver-sandwich.webp" },
  { id: "heart-sandwich", name: "Heart Sandwich", arabic: "ساندوتش قلب", category: "sandwiches", description: "A heart sandwich from the published menu.", price: null, image: "assets/menu/heart-sandwich.webp" },
  { id: "makhasi-sandwich", name: "Makhasi Sandwich", arabic: "ساندوتش مخاصي", category: "sandwiches", description: "A makhasi sandwich from the published menu.", price: null, image: "assets/menu/makhasi-sandwich.webp" },
  { id: "crispy", name: "Crispy", arabic: "كرسبي", category: "sandwiches", description: "Crispy from the published sandwich selection.", price: null, image: "assets/menu/crispy.webp" },
  { id: "crispy-spicy", name: "Crispy Spicy", arabic: "كرسبي سبايسي", category: "sandwiches", description: "Crispy Spicy from the published sandwich selection.", price: null, image: "assets/menu/crispy-spicy.webp" },
  { id: "zinger-burger", name: "Zinger Burger", arabic: "زنجر برجر", category: "sandwiches", description: "Zinger burger from the published sandwich menu.", price: null, image: "assets/menu/zinger-burger.webp" },
  { id: "mexicano", name: "Mexicano", arabic: "مكسيكانو", category: "sandwiches", description: "Mexicano from the published sandwich selection.", price: null, image: "assets/menu/mexicano.webp" },
  { id: "fransisco", name: "Fransisco", arabic: "فرانسيسكو", category: "sandwiches", description: "Fransisco from the published sandwich selection.", price: null, image: "assets/menu/fransisco.webp" },
  { id: "fajita", name: "Fajita", arabic: "فاهيتا", category: "sandwiches", description: "Fajita from the published sandwich selection.", price: null, image: "assets/menu/fajita.webp" },
  { id: "toshka-charcoal", name: "Toshka Charcoal", arabic: "توشكا على الفحم", category: "sandwiches", description: "Toshka Charcoal from the published sandwich menu.", price: null, image: "assets/menu/toshka-charcoal.webp" },
  { id: "chicken-supreme", name: "Chicken Supreme", arabic: "تشيكن سوبريم", category: "sandwiches", description: "Chicken Supreme from the published sandwich menu.", price: null, image: "assets/menu/chicken-supreme.webp" },
  { id: "chicken-scallop", name: "Chicken Scallop", arabic: "تشيكن سكالوب", category: "sandwiches", description: "Chicken Scallop from the published sandwich menu.", price: null, image: "assets/menu/chicken-scallop.webp" },

  // Chicken and broasted
  { id: "shish-tawook", name: "Shish Tawook", arabic: "شيش طاووق", category: "chicken", description: "Shish tawook from the published chicken selection.", price: null, image: "assets/menu/shish-tawook.webp" },
  { id: "charcoal-chicken", name: "Charcoal Chicken", arabic: "فرخة على الفحم", category: "chicken", description: "Charcoal chicken from the published chicken menu.", price: null, image: "assets/menu/charcoal-chicken.webp" },
  { id: "charcoal-chicken-plate", name: "Charcoal Chicken Plate", arabic: "طبق فرخة على الفحم", category: "chicken", description: "A charcoal chicken plate from the published menu.", price: null, image: "assets/menu/charcoal-chicken-plate.webp" },
  { id: "charcoal-chicken-bread", name: "Charcoal Chicken with Bread", arabic: "فرخة على الفحم بالخبز", category: "chicken", description: "Charcoal chicken with bread from the published menu.", price: null, image: "assets/menu/charcoal-chicken-bread.webp" },
  { id: "half-roast-chicken", name: "Half Roast Chicken", arabic: "نصف فرخة شواية", category: "chicken", description: "Half roast chicken as named on the published menu.", price: null, image: "assets/menu/half-roast-chicken.webp" },
  { id: "whole-roast-chicken", name: "Whole Roast Chicken", arabic: "فرخة شواية كاملة", category: "chicken", description: "Whole roast chicken as named on the published menu.", price: null, image: "assets/menu/whole-roast-chicken.webp" },
  { id: "grilled-chicken", name: "Grilled Chicken", arabic: "فراخ مشوية", category: "chicken", description: "Grilled chicken from the published chicken menu.", price: null, image: "assets/menu/grilled-chicken.webp" },
  { id: "chicken-mansaf", name: "Chicken Mansaf", arabic: "منسف فراخ", category: "chicken", description: "Chicken mansaf from the published restaurant menu.", price: null, image: "assets/menu/chicken-mansaf.webp" },
  { id: "broasted-chicken", name: "Broasted Chicken", arabic: "فرخة بروستد", category: "chicken", description: "Broasted chicken from the published chicken menu.", price: null, image: "assets/menu/broasted-chicken.webp" },
  { id: "half-broasted", name: "Half Broasted Chicken", arabic: "نصف فرخة بروستد", category: "chicken", description: "Half broasted chicken as named on the published menu.", price: null, image: "assets/menu/half-broasted.webp" },
  { id: "rizo-plain", name: "Plain Crispy Chicken Rizo", arabic: "ريزو كرسبي فراخ سادة", category: "chicken", description: "Plain crispy chicken rizo from the published menu.", price: null, image: "assets/menu/rizo-plain.webp" },
  { id: "rizo-bbq", name: "BBQ Crispy Chicken Rizo", arabic: "ريزو كرسبي فراخ باربكيو", category: "chicken", description: "BBQ crispy chicken rizo from the published menu.", price: null, image: "assets/menu/rizo-bbq.webp" },
  { id: "rizo-cheddar", name: "Cheddar Crispy Chicken Rizo", arabic: "ريزو كرسبي فراخ شيدر", category: "chicken", description: "Cheddar crispy chicken rizo from the published menu.", price: null, image: "assets/menu/rizo-cheddar.webp" },
  { id: "rizo-ranch", name: "Ranch Crispy Chicken Rizo", arabic: "ريزو كرسبي فراخ رانش", category: "chicken", description: "Ranch crispy chicken rizo from the published menu.", price: null, image: "assets/menu/rizo-ranch.webp" },
  { id: "kaiser-box", name: "Kaiser Box", arabic: "كايزر بوكس", category: "chicken", description: "Kaiser Box from the published chicken selection.", price: null, image: "assets/menu/kaiser-box.webp" },

  // Desserts
  { id: "kunafa-cheese", name: "Kunafa with Cheese", arabic: "كنافة بالجبنة", category: "desserts", description: "Kunafa with cheese from the published dessert list.", price: null, image: "assets/kunafa-illustrative.webp", illustrative: true },
  { id: "kunafa-cream", name: "Kunafa with Cream", arabic: "كنافة بالكريمة", category: "desserts", description: "Kunafa with cream from the published dessert list.", price: null, image: "assets/kunafa-illustrative.webp", illustrative: true },
  { id: "nutella-cream-kunafa", name: "Nutella Cream Kunafa", arabic: "كنافة نوتيلا بالكريمة", category: "desserts", description: "Nutella cream kunafa from the published dessert list.", price: null, image: "assets/kunafa-illustrative.webp", illustrative: true },
  { id: "pistachio-cream-kunafa", name: "Cream Kunafa with Pistachio", arabic: "كنافة بالكريمة والفستق", category: "desserts", description: "Cream kunafa with pistachio from the published dessert list.", price: null, image: "assets/kunafa-illustrative.webp", illustrative: true },

  // Cold drinks
  { id: "bottled-water", name: "Dasani Egypt", arabic: "مياه داساني مصر", category: "drinks", description: "Dasani drinking water from Egypt, served chilled.", descriptionAr: "مياه داساني للشرب من مصر، تُقدّم باردة.", price: null, image: "assets/dasani-egypt-official-3840.webp", official: true },
  { id: "ayran", name: "Ayran", arabic: "عيران", category: "drinks", description: "Refreshing Ayran yogurt drink, served chilled.", descriptionAr: "مشروب عيران منعش بالزبادي، يُقدّم باردًا.", price: null, image: "assets/ayran-official-3840.webp", official: true },
  { id: "v7-cola", name: "V7 Cola", arabic: "ڤي 7 كولا", category: "drinks", description: "V7 Cola from the published cold-drinks list.", price: null, image: "assets/v7-card-official-cola-3840.webp", official: true },
  { id: "v-cola-diet", name: "V Cola Diet", arabic: "ڤي كولا دايت", category: "drinks", description: "V Cola Diet from the published cold-drinks list.", price: null, image: "assets/v7-card-official-diet-cola-3840.webp", official: true },
  { id: "v-cola-blueberry", name: "V Cola Blueberry", arabic: "ڤي كولا توت أزرق", category: "drinks", description: "Blueberry V Cola from the published cold-drinks list.", price: null, image: "assets/v7-card-official-blueberry-3840.webp", official: true },
  { id: "v-cola-pink-lemonade", name: "V Cola Pink Lemonade", arabic: "ڤي كولا بينك ليمون", category: "drinks", description: "Pink lemonade V Cola from the published drinks list.", price: null, image: "assets/v7-card-official-pink-lemonade-3840.webp", official: true },
  { id: "v-cola-lemon", name: "V Cola Lemon", arabic: "ڤي كولا ليمون", category: "drinks", description: "Lemon V Cola from the published cold-drinks list.", price: null, image: "assets/v7-card-official-lemon-3840.webp", official: true },
  { id: "v-cola-pomegranate", name: "V Cola Pomegranate", arabic: "ڤي كولا رمان", category: "drinks", description: "Pomegranate V Cola from the published drinks list.", price: null, image: "assets/v7-card-official-pomegranate-3840.webp", official: true }
];

const menuSource = window.KHAN_MENU_SOURCE || {};
menuCategories = [];
let menuItems = [];

let categoryLabels = Object.fromEntries(menuCategories.map(category => [category.id, category.label]));
let categoryLabelsAr = Object.fromEntries(menuCategories.map(category => [category.id, category.ar]));

const staticTextAr = new Map(Object.entries({
  "Skip to main content": "انتقل إلى المحتوى الرئيسي",
  "Menu": "المنيو",
  "About": "عن المطعم",
  "Gallery": "الصور",
  "Contact": "تواصل معنا",
  "View the menu": "شاهد المنيو",
  "Explore the dishes": "اكتشف أطباقنا",
  "Our table in New Cairo": "سفرتنا في القاهرة الجديدة",
  "A feast for the eyes": "وليمة تسرّ العين",
  "Find the Banafseg branch": "اعثر على فرع البنفسج",
  "Syrian & Middle Eastern cuisine": "مطبخ سوري وشرق أوسطي",
  "New Cairo": "القاهرة الجديدة",
  "Authentic Halaby": "نكهات أصيلة",
  "flavors,": "بطابع حلبي،",
  "made with love.": "محضّرة بحب.",
  "From shawarma and charcoal grills to mezze and kunafa—there is always room for one more at the table.": "من الشاورما والمشاوي على الفحم إلى المقبلات والكنافة—دائمًا هناك مكان لشخص آخر على السفرة.",
  "Illustrative photography": "صور توضيحية",
  "The house favorite": "المفضلة في المطعم",
  "Shawarma": "شاورما",
  "Explore 18 dishes ↗": "اكتشف 18 طبقًا ↗",
  "From the coals": "من على الفحم",
  "Charcoal & grills": "الفحم والمشاوي",
  "Explore the grill ↗": "اكتشف المشاوي ↗",
  "Made for sharing": "معدّة للمشاركة",
  "Mezze": "مقبلات",
  "Start with a small plate ↗": "ابدأ بطبق صغير ↗",
  "Behind every plate": "خلف كل طبق",
  "Syrian kitchen": "المطبخ السوري",
  "See how we cook ↗": "شاهد كيف نطبخ ↗",
  "Served ice-cold": "تُقدَّم مثلجة",
  "Explore the drinks ↗": "اكتشف المشروبات ↗",
  "The menu": "المنيو",
  "Come hungry.": "تعال جائعًا.",
  "Leave happy.": "وارحل سعيدًا.",
  "A love letter to Halaby food—charcoal grills, fragrant spices, warm bread, generous mezze, and recipes made to bring people together.": "رسالة حب إلى المطبخ الحلبي؛ مشاوي على الفحم، وتوابل عطرة، وخبز دافئ، ومقبلات سخية، ووصفات تجمع الأحبة حول السفرة.",
  "Clear": "مسح",
  "No dishes found": "لم نعثر على أطباق",
  "Try another search or browse the full menu.": "جرّب بحثًا آخر أو تصفّح المنيو كاملًا.",
  "Reset filters": "إعادة ضبط الفلاتر",
  "Show more dishes": "عرض أطباق أخرى",
  "View the official QR menu": "شاهد منيو QR الرسمي",
  "Search the menu": "ابحث في المنيو",
  "The current restaurant menu": "منيو المطعم الحالي",
  "Explore.": "اكتشف.",
  "Find your next favorite.": "اكتشف طبقك المفضل القادم.",
  "Browse every current category, dish, and EGP price from Khan Al Harir’s official QR menu.": "تصفّح جميع الأقسام والأطباق والأسعار الحالية بالجنيه المصري من منيو QR الرسمي لخان الحرير.",
  "View the": "شاهد",
  "full menu": "المنيو كاملًا",
  "Prices load directly from the restaurant’s official menu.": "تُحمّل الأسعار مباشرة من منيو المطعم الرسمي.",
  "At the table": "على السفرة",
  "A taste of Syria,": "مذاق من سوريا،",
  "at home in New Cairo.": "في قلب القاهرة الجديدة.",
  "Khan Al Harir brings the generous spirit of a Syrian table to El Tagamo3. Shawarma, charcoal-grilled meats, colorful mezze, warm bread, and sweets all invite you to slow down and share.": "يقدّم خان الحرير روح الضيافة السورية الأصيلة إلى التجمع. الشاورما والمشاوي على الفحم والمقبلات الملوّنة والخبز الدافئ والحلويات تدعوك للتمهّل والمشاركة.",
  "Come for a quick sandwich, gather over a mixed grill, or take dinner home. The menu offers both everyday favorites and generous meals for a full table.": "تعال لسندوتش سريع، أو اجتمع حول طبق مشاوي مشكلة، أو خذ العشاء إلى بيتك. يقدم المنيو اختيارات يومية محبوبة ووجبات سخية لسفرة كاملة.",
  "Syrian & Middle Eastern restaurant": "مطعم سوري وشرق أوسطي",
  "From the kitchen": "من المطبخ",
  "A feast for the eyes.": "وليمة تسرّ العين.",
  "A selection of Khan Al Harir dishes and table favorites.": "تشكيلة من أطباق خان الحرير ومفضلات السفرة.",
  "Friends Tray": "صينية الأصدقاء",
  "Shawarma Saj": "شاورما صاج",
  "Hummus & pita": "حمص وخبز",
  "Charcoal Chicken": "فراخ على الفحم",
  "Kunafa": "كنافة",
  "Lentil Soup": "شوربة عدس",
  "Cold drinks": "مشروبات باردة",
  "Restaurant listing photo": "صورة من قائمة المطعم",
  "Generated 4K photo": "صورة مولّدة بدقة 4K",
  "Illustrative photo": "صورة توضيحية",
  "Illustrative artwork": "رسم توضيحي",
  "Menu lineup visual": "صورة تشكيلة المنيو",
  "V Cola drinks": "مشروبات ڤي كولا",
  "Official product photos": "صور المنتجات الرسمية",
  "Find your way to the Khan": "طريقك إلى خان الحرير",
  "Your table": "سفرتك",
  "is in New Cairo.": "في القاهرة الجديدة.",
  "Open in Google Maps": "افتح في خرائط Google",
  "Branch": "الفرع",
  "Banafseg, First Settlement": "البنفسج، التجمع الأول",
  "Mall 24, Banafseg Service Area,": "مول 24، منطقة خدمات البنفسج،",
  "Villa 10, Dr. Ahmed Okasha Street,": "فيلا 10، شارع د. أحمد عكاشة،",
  "New Cairo, Egypt": "القاهرة الجديدة، مصر",
  "Delivery hotline": "الخط الساخن للتوصيل",
  "Branch phone": "هاتف الفرع",
  "Contact and address details are shown as published in the restaurant directory listing. Opening hours are not displayed because they could not be verified.": "تُعرض بيانات التواصل والعنوان كما نُشرت في دليل المطعم. لا تُعرض مواعيد العمل لعدم التمكن من التحقق منها.",
  "Khan Al Harir. Menu items, categories, and EGP prices load only from the official QR menu.": "خان الحرير. تُحمّل أصناف المنيو والأقسام والأسعار بالجنيه المصري فقط من منيو QR الرسمي.",
  "Availability and prices may change when the official QR menu is updated.": "قد يتغير التوفر والأسعار عند تحديث منيو QR الرسمي.",
  "Follow Khan Al Harir": "تابع خان الحرير",
  "Stay close to our Halaby table, latest dishes, offers, and restaurant moments.": "خليك قريب من سفرتنا الحلبية، وأحدث الأطباق والعروض ولحظات المطعم.",
  "Facebook": "فيسبوك",
  "Instagram": "إنستجرام",
  "TikTok": "تيك توك",
  "WhatsApp": "واتساب"
}));

const attributeTextAr = new Map(Object.entries({
  "Khan Al Harir, back to home": "خان الحرير، العودة إلى الرئيسية",
  "Main navigation": "التنقل الرئيسي",
  "Mobile navigation": "التنقل على الهاتف",
  "Open navigation": "فتح قائمة التنقل",
  "Close navigation": "إغلاق قائمة التنقل",
  "Explore the menu by cuisine": "استكشف المنيو حسب نوع المطبخ",
  "Search the menu": "ابحث في المنيو",
  "Search shawarma, kofta, كنافة…": "ابحث عن شاورما، كفتة، كنافة…",
  "Clear menu search": "مسح بحث المنيو",
  "Filter menu by category": "تصفية المنيو حسب القسم",
  "Footer navigation": "تنقل التذييل",
  "Back to top": "العودة إلى أعلى الصفحة",
  "Food photo viewer": "عارض صور الطعام",
  "Close photo viewer": "إغلاق عارض الصور",
  "Previous photo": "الصورة السابقة",
  "Next photo": "الصورة التالية",
  "Khan Al Harir social media": "حسابات خان الحرير على وسائل التواصل",
  "Open Khan Al Harir on Facebook": "افتح صفحة خان الحرير على فيسبوك",
  "Open Khan Al Harir on Instagram": "افتح صفحة خان الحرير على إنستجرام",
  "Open Khan Al Harir on TikTok": "افتح صفحة خان الحرير على تيك توك",
  "Chat with Khan Al Harir on WhatsApp": "تواصل مع خان الحرير على واتساب"
}));

const galleryCaptionsAr = new Map(Object.entries({
  "Friends Tray": "صينية الأصدقاء",
  "Shawarma Saj": "شاورما صاج",
  "Hummus and pita": "حمص وخبز",
  "Charcoal Chicken": "فراخ على الفحم",
  "Kunafa": "كنافة",
  "Lentil Soup": "شوربة عدس",
  "V Cola drinks": "مشروبات ڤي كولا"
}));

const arabicMenuDescriptions = {
  offers: "من العروض الحالية المنشورة في منيو المطعم الرسمي.",
  "shawarma-sandwiches": "من تشكيلة ساندوتشات الشاورما الحالية.",
  "shawarma-meals": "من تشكيلة وجبات الشاورما الحالية.",
  "western-meals": "من تشكيلة الوجبات الغربية الحالية.",
  "western-sandwiches": "من تشكيلة الساندوتشات الغربية الحالية.",
  burgers: "من تشكيلة البرجر الحالية.",
  broasted: "من تشكيلة الدجاج البروستد الحالية.",
  shawaya: "من تشكيلة دجاج الشواية الحالية.",
  "charcoal-chicken": "من تشكيلة الدجاج المشوي على الفحم الحالية.",
  casseroles: "من تشكيلة الطواجن الحالية.",
  "meat-grills": "من تشكيلة مشويات اللحوم الحالية.",
  "grilled-sandwiches": "من تشكيلة ساندوتشات المشاوي الحالية.",
  "grilled-meals": "من تشكيلة وجبات المشاوي الحالية.",
  trays: "من تشكيلة الصواني الحالية.",
  addons: "من قائمة الإضافات الحالية.",
  pies: "من تشكيلة الفطائر الحالية.",
  appetizers: "من تشكيلة المقبلات المنشورة لدى المطعم.",
  soups: "من تشكيلة الشوربات المنشورة لدى المطعم.",
  desserts: "من قائمة الحلويات المنشورة لدى المطعم.",
  drinks: "من قائمة المشروبات الباردة المنشورة لدى المطعم."
};

let menuLoadState = "loading";
let failedCategoryCount = 0;
let lastMenuRefreshAt = 0;
let lastMenuSignature = "";
let menuRefreshInFlight = false;

function categorySlug(category) {
  const english = category?.title?.en || `category-${category?.id || "menu"}`;
  return english.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function asPrice(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function productPriceRange(product) {
  const basePrice = asPrice(product.price);
  const optionPrices = (product.attributes || [])
    .filter(attribute => Number(attribute.override_price) === 1)
    .flatMap(attribute => attribute.values || [])
    .map(value => asPrice(value.price))
    .filter(Number.isFinite);
  const prices = [basePrice, ...optionPrices].filter(Number.isFinite);
  return prices.length ? { min: Math.min(...prices), max: Math.max(...prices) } : null;
}

function productPriceOptions(product) {
  const seen = new Set();
  return (product.attributes || [])
    .filter(attribute => Number(attribute.override_price) === 1)
    .flatMap(attribute => attribute.values || [])
    .map(value => ({
      label: value.title?.en || value.title?.ar || "Option",
      labelAr: value.title?.ar || value.title?.en || "اختيار",
      price: asPrice(value.price)
    }))
    .filter(option => {
      if (!Number.isFinite(option.price)) return false;
      const key = `${option.label}|${option.labelAr}|${option.price}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function productToMenuItem(product, category) {
  const range = productPriceRange(product);
  const basePrice = asPrice(product.discounted_price) ?? asPrice(product.price);
  const priceOptions = productPriceOptions(product);
  return {
    id: `official-${product.id}`,
    name: product.title?.en || product.title?.ar || "Menu item",
    arabic: product.title?.ar || product.title?.en || "صنف من المنيو",
    description: product.description?.en || "From Khan Al Harir's official QR menu.",
    descriptionAr: product.description?.ar || "من منيو خان الحرير الرسمي.",
    category: categorySlug(category),
    price: basePrice,
    oldPrice: asPrice(product.discounted_price) !== null ? asPrice(product.price) : null,
    priceMin: range?.min ?? basePrice,
    priceMax: range?.max ?? basePrice,
    priceOptions,
    priceStatus: Number.isFinite(basePrice) ? "verified" : "unverified",
    image: product.images?.[0]?.image || category.image || "assets/image-fallback.svg",
    illustrative: false,
    official: true
  };
}

function officialMenuSignature(items) {
  return JSON.stringify(items.map(item => [
    item.id,
    item.price,
    item.oldPrice,
    item.priceMin,
    item.priceMax,
    item.priceOptions.map(option => [option.label, option.labelAr, option.price])
  ]));
}

function updateMenuSourceMessage() {
  const element = document.getElementById("menuSource");
  if (!element) return;
  element.textContent = currentLanguage === "ar"
    ? "المطبخ الحلبي حكاية من النكهات العريقة والكرم الذي يجمع الأحبة حول السفرة."
    : "Halaby cuisine is a story of timeless flavors and generous tables that bring loved ones together.";
}

async function fetchJSON(url) {
  const response = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Menu request failed (${response.status})`);
  const payload = await response.json();
  if (!payload?.status) throw new Error(payload?.msg || "Menu response was not successful");
  return payload.data;
}

async function loadOfficialMenu({ preserveView = false } = {}) {
  if (menuRefreshInFlight) return;
  const { apiBase, branchId } = menuSource;
  if (!apiBase || !branchId) {
    menuLoadState = "error";
    updateMenuSourceMessage();
    renderMenu();
    return;
  }

  menuRefreshInFlight = true;
  lastMenuRefreshAt = Date.now();
  try {
    const previousCategory = state.category;
    const previousVisible = state.visible;
    const categories = await fetchJSON(`${apiBase}/branches/${branchId}/categories`);
    menuCategories = categories.map(category => ({
      id: categorySlug(category),
      label: category.title?.en || category.title?.ar || "Menu",
      ar: category.title?.ar || category.title?.en || "المنيو",
      sourceId: category.id,
      source: category
    }));
    categoryLabels = Object.fromEntries(menuCategories.map(category => [category.id, category.label]));
    categoryLabelsAr = Object.fromEntries(menuCategories.map(category => [category.id, category.ar]));

    const loadedItems = [];
    failedCategoryCount = 0;
    for (let offset = 0; offset < menuCategories.length; offset += 6) {
      const batch = menuCategories.slice(offset, offset + 6);
      const results = await Promise.allSettled(batch.map(async category => {
        const data = await fetchJSON(`${apiBase}/branches/${branchId}/categories/${category.sourceId}/products`);
        return (data.products || []).map(product => productToMenuItem(product, category.source));
      }));
      results.forEach(result => {
        if (result.status === "fulfilled") loadedItems.push(...result.value);
        else failedCategoryCount += 1;
      });
    }

    if (!loadedItems.length) throw new Error("The official menu returned no products");
    const nextSignature = officialMenuSignature(loadedItems);
    const menuChanged = nextSignature !== lastMenuSignature;
    menuItems = loadedItems;
    lastMenuSignature = nextSignature;
    menuLoadState = "loaded";
    state.category = preserveView && (previousCategory === "all" || menuCategories.some(category => category.id === previousCategory))
      ? previousCategory
      : "all";
    state.visible = preserveView ? Math.max(PAGE_SIZE, previousVisible) : PAGE_SIZE;
    updateMenuSourceMessage();
    if (menuChanged || !preserveView) renderMenu();
  } catch (error) {
    if (preserveView && menuItems.length) {
      console.warn("Official menu background refresh failed", error);
      return;
    }
    console.error("Official menu load failed", error);
    menuItems = [];
    menuLoadState = "error";
    updateMenuSourceMessage();
    renderMenu();
  } finally {
    menuRefreshInFlight = false;
  }
}

function refreshOfficialMenuIfStale() {
  if (Date.now() - lastMenuRefreshAt < MENU_REFRESH_MIN_GAP_MS) return;
  loadOfficialMenu({ preserveView: true });
}

function preferredLanguage() {
  try {
    const saved = localStorage.getItem("khan-language");
    if (saved === "ar" || saved === "en") return saved;
  } catch (_) {
    // Storage can be unavailable in privacy modes; browser language remains a safe fallback.
  }
  return navigator.language.toLowerCase().startsWith("ar") ? "ar" : "en";
}

let currentLanguage = preferredLanguage();
const staticTextNodes = [];

function currentCategoryLabel(category) {
  return currentLanguage === "ar" ? categoryLabelsAr[category] : categoryLabels[category];
}

function initializeStaticTranslations() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const parent = node.parentElement;
    if (!parent || parent.closest("script, style, #menuGrid, #categoryFilters, #menuCount")) continue;
    const key = node.nodeValue.trim();
    const arabic = staticTextAr.get(key);
    if (!arabic) continue;
    const leading = node.nodeValue.match(/^\s*/)?.[0] || "";
    const trailing = node.nodeValue.match(/\s*$/)?.[0] || "";
    staticTextNodes.push({ node, en: node.nodeValue, ar: `${leading}${arabic}${trailing}` });
  }
}

function translateStaticContent(language) {
  staticTextNodes.forEach(entry => { entry.node.nodeValue = language === "ar" ? entry.ar : entry.en; });
  document.querySelectorAll("[aria-label], [placeholder]").forEach(element => {
    ["aria-label", "placeholder"].forEach(attribute => {
      if (!element.hasAttribute(attribute)) return;
      const dataKey = `i18n${attribute === "aria-label" ? "AriaLabel" : "Placeholder"}`;
      if (!element.dataset[dataKey]) element.dataset[dataKey] = element.getAttribute(attribute);
      const english = element.dataset[dataKey];
      element.setAttribute(attribute, language === "ar" ? (attributeTextAr.get(english) || english) : english);
    });
  });
}

function setLanguage(language, persist = true) {
  currentLanguage = language === "ar" ? "ar" : "en";
  const isArabic = currentLanguage === "ar";
  document.documentElement.lang = currentLanguage;
  document.documentElement.dir = isArabic ? "rtl" : "ltr";
  document.title = isArabic ? "خان الحرير | مطعم سوري في القاهرة الجديدة" : "Khan Al Harir خان الحرير | Syrian Restaurant in New Cairo";
  document.querySelector('meta[name="description"]').content = isArabic
    ? "اكتشف منيو خان الحرير الحلبي والسوري الحالي مع الأسعار الرسمية بالجنيه المصري في القاهرة الجديدة."
    : "Explore Khan Al Harir’s current Halaby and Syrian menu with official EGP prices in New Cairo.";
  translateStaticContent(currentLanguage);
  updateMenuSourceMessage();

  const languageToggle = document.getElementById("languageToggle");
  languageToggle.setAttribute("aria-pressed", String(isArabic));
  languageToggle.setAttribute("aria-label", isArabic ? "Switch to English" : "Switch to Arabic");
  languageToggle.querySelector(".language-toggle-icon").textContent = isArabic ? "EN" : "ع";
  languageToggle.querySelector(".language-toggle-label").textContent = isArabic ? "English" : "العربية";
  menuToggle.setAttribute("aria-label", mobileNav.hidden
    ? (isArabic ? "فتح قائمة التنقل" : "Open navigation")
    : (isArabic ? "إغلاق قائمة التنقل" : "Close navigation"));

  renderMenu();
  if (menuDetail?.open && menuDetailItemId) {
    const openItem = menuItems.find(item => item.id === menuDetailItemId);
    if (openItem) populateMenuDetail(openItem);
  }
  if (lightbox.open) updateLightbox(galleryIndex);
  if (persist) {
    try { localStorage.setItem("khan-language", currentLanguage); } catch (_) { /* optional preference */ }
  }
}

const state = { category: "all", query: "", visible: PAGE_SIZE };
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const desktopMedia = window.matchMedia("(min-width: 900px)");

const menuGrid = document.getElementById("menuGrid");
const menuCount = document.getElementById("menuCount");
const menuSearch = document.getElementById("menuSearch");
const clearSearch = document.getElementById("clearSearch");
const categoryFilters = document.getElementById("categoryFilters");
const emptyState = document.getElementById("emptyState");
const showMore = document.getElementById("showMore");
const resetFilters = document.getElementById("resetFilters");
const siteHeader = document.getElementById("siteHeader");
const menuToggle = document.getElementById("menuToggle");
const mobileNav = document.getElementById("mobileNav");
const languageToggle = document.getElementById("languageToggle");

languageToggle.addEventListener("click", () => {
  setLanguage(currentLanguage === "ar" ? "en" : "ar");
});

function escapeHTML(value) {
  return String(value).replace(/[&<>'"]/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[character]);
}

function normalizeText(value) {
  return String(value)
    .normalize("NFKD")
    .toLocaleLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .trim();
}

function filteredItems() {
  const query = normalizeText(state.query);
  return menuItems.filter(item => {
    const inCategory = state.category === "all" || item.category === state.category;
    if (!inCategory) return false;
    if (!query) return true;
    const searchable = normalizeText(`${item.name} ${item.arabic} ${item.description} ${item.descriptionAr} ${arabicMenuDescriptions[item.category]} ${categoryLabels[item.category]} ${categoryLabelsAr[item.category]}`);
    return searchable.includes(query);
  });
}

function priceDetails(item) {
  return { price: item.price, status: item.priceStatus || (Number.isFinite(item.price) ? "verified" : "unverified") };
}

function formatPrice(item) {
  const details = priceDetails(item);
  if (details.status === "variable") {
    return currentLanguage === "ar" ? "السعر حسب الاختيار" : "Price varies by selection";
  }
  if (Array.isArray(item.priceOptions) && item.priceOptions.length > 1) {
    const locale = currentLanguage === "ar" ? "ar-EG" : "en-EG";
    const formatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
    return item.priceOptions.map(option => {
      const label = currentLanguage === "ar" ? option.labelAr : option.label;
      const price = currentLanguage === "ar"
        ? `${formatter.format(option.price)} ج.م`
        : `${formatter.format(option.price)} EGP`;
      return `${label}: ${price}`;
    }).join(" · ");
  }
  if (Number.isFinite(item.priceMin) && Number.isFinite(item.priceMax) && item.priceMin !== item.priceMax) {
    const locale = currentLanguage === "ar" ? "ar-EG" : "en-EG";
    const formatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
    return currentLanguage === "ar"
      ? `${formatter.format(item.priceMin)}–${formatter.format(item.priceMax)} ج.م`
      : `${formatter.format(item.priceMin)}–${formatter.format(item.priceMax)} EGP`;
  }
  return typeof details.price === "number" && Number.isFinite(details.price)
    ? currentLanguage === "ar"
      ? `${new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 2 }).format(details.price)} ج.م`
      : `${new Intl.NumberFormat("en-EG", { maximumFractionDigits: 2 }).format(details.price)} EGP`
    : currentLanguage === "ar" ? "السعر غير متاح حاليًا" : "Price currently unavailable";
}

function menuCard(item) {
  const isArabic = currentLanguage === "ar";
  const displayName = isArabic ? item.arabic : item.name;
  const description = isArabic ? (item.descriptionAr || arabicMenuDescriptions[item.category]) : (item.description || "From the current online menu.");
  return `
    <article class="menu-card" data-item-id="${escapeHTML(item.id)}" tabindex="0" role="button" aria-label="${escapeHTML(isArabic ? `عرض تفاصيل ${displayName}` : `View details for ${displayName}`)}">
      <div class="menu-card-media">
        <img src="${escapeHTML(item.image)}" alt="${escapeHTML(displayName)}" width="3840" height="2160" loading="lazy" decoding="async">
      </div>
      <div class="menu-card-body">
        <p class="menu-card-category">${escapeHTML(currentCategoryLabel(item.category))}</p>
        <div class="menu-card-title-row">
          <h3>${escapeHTML(displayName)}</h3>
          <p class="menu-card-arabic" lang="ar" dir="rtl">${isArabic ? "" : escapeHTML(item.arabic)}</p>
        </div>
        <p class="menu-card-description">${escapeHTML(description)}</p>
        <div class="menu-card-footer">
          <p class="menu-card-price" data-price-status="${escapeHTML(priceDetails(item).status)}">${formatPrice(item)}</p>
          <span class="menu-card-view">${isArabic ? "عرض التفاصيل" : "View details"} <span aria-hidden="true">↗</span></span>
        </div>
      </div>
    </article>`;
}

function renderCategories() {
  const allButton = `<button type="button" data-category="all">${currentLanguage === "ar" ? "كل الأطباق" : "All dishes"}</button>`;
  categoryFilters.innerHTML = allButton + menuCategories.map(category => {
    const count = menuItems.filter(item => item.category === category.id).length;
    const countLabel = currentLanguage === "ar" ? `${count} طبقًا` : `${count} dishes`;
    return `<button type="button" data-category="${category.id}">${escapeHTML(currentCategoryLabel(category.id))} <span class="sr-only">(${countLabel})</span></button>`;
  }).join("");
  categoryFilters.querySelectorAll("button[data-category]").forEach(button => {
    button.setAttribute("aria-pressed", String(button.dataset.category === state.category));
  });
}

function renderMenu() {
  const matches = filteredItems();
  const visibleItems = matches.slice(0, state.visible);
  menuGrid.innerHTML = visibleItems.map(menuCard).join("");
  emptyState.hidden = menuLoadState === "loading" || matches.length !== 0;
  menuGrid.hidden = matches.length === 0;
  clearSearch.hidden = state.query.length === 0;

  const context = state.category === "all"
    ? (currentLanguage === "ar" ? "طبقًا" : "dishes")
    : currentCategoryLabel(state.category).toLowerCase();
  menuCount.textContent = matches.length === 0
    ? (currentLanguage === "ar" ? "لم نعثر على أطباق" : "No dishes found")
    : currentLanguage === "ar"
      ? `نعرض ${visibleItems.length} من ${matches.length} — ${context}`
      : `Showing ${visibleItems.length} of ${matches.length} ${context}`;

  showMore.hidden = matches.length === 0 || state.visible >= matches.length;
  if (!showMore.hidden) {
    const remaining = matches.length - state.visible;
    showMore.textContent = currentLanguage === "ar"
      ? `عرض أطباق أخرى (${Math.min(PAGE_SIZE, remaining)} من ${remaining})`
      : `Show more dishes (${Math.min(PAGE_SIZE, remaining)} of ${remaining})`;
  }
  renderCategories();
}

function chooseCategory(category, shouldScroll = false) {
  state.category = category === "all" || categoryLabels[category] ? category : "all";
  state.visible = PAGE_SIZE;
  renderMenu();
  if (shouldScroll) {
    document.getElementById("menu").scrollIntoView({ behavior: prefersReducedMotion.matches ? "auto" : "smooth" });
  }
}

categoryFilters.addEventListener("click", event => {
  const button = event.target.closest("button[data-category]");
  if (button) chooseCategory(button.dataset.category);
});

menuSearch.addEventListener("input", () => {
  state.query = menuSearch.value;
  state.visible = PAGE_SIZE;
  renderMenu();
});

clearSearch.addEventListener("click", () => {
  state.query = "";
  menuSearch.value = "";
  state.visible = PAGE_SIZE;
  renderMenu();
  menuSearch.focus();
});

resetFilters.addEventListener("click", () => {
  state.query = "";
  state.category = "all";
  state.visible = PAGE_SIZE;
  menuSearch.value = "";
  renderMenu();
  menuSearch.focus();
});

showMore.addEventListener("click", () => {
  const firstNewIndex = state.visible;
  state.visible += PAGE_SIZE;
  renderMenu();
  const firstNewCard = menuGrid.children[firstNewIndex];
  if (showMore.hidden && firstNewCard) firstNewCard.focus({ preventScroll: true });
});

// Clicking any menu card opens a focused, bilingual dish detail dialog.
const menuDetail = document.getElementById("menuDetail");
const menuDetailImage = document.getElementById("menuDetailImage");
const menuDetailCategory = document.getElementById("menuDetailCategory");
const menuDetailName = document.getElementById("menuDetailName");
const menuDetailSecondary = document.getElementById("menuDetailSecondary");
const menuDetailDescription = document.getElementById("menuDetailDescription");
const menuDetailPriceLabel = document.getElementById("menuDetailPriceLabel");
const menuDetailPrice = document.getElementById("menuDetailPrice");
let menuDetailItemId = null;
let menuDetailOpener = null;

function populateMenuDetail(item) {
  const isArabic = currentLanguage === "ar";
  const displayName = isArabic ? item.arabic : item.name;
  const secondaryName = isArabic ? item.name : item.arabic;
  const description = isArabic
    ? (item.descriptionAr || arabicMenuDescriptions[item.category])
    : (item.description || "From the current online menu.");
  menuDetailImage.src = item.image;
  menuDetailImage.alt = isArabic ? `صورة ${displayName}` : `${displayName} dish`;
  menuDetailCategory.textContent = currentCategoryLabel(item.category);
  menuDetailName.textContent = displayName;
  menuDetailSecondary.textContent = secondaryName;
  menuDetailSecondary.lang = isArabic ? "en" : "ar";
  menuDetailSecondary.dir = isArabic ? "ltr" : "rtl";
  menuDetailDescription.textContent = description;
  menuDetailPriceLabel.textContent = isArabic ? "السعر" : "Price";
  menuDetailPrice.textContent = formatPrice(item);
  menuDetailPrice.dataset.priceStatus = priceDetails(item).status;
  menuDetail.setAttribute("aria-label", isArabic ? `تفاصيل ${displayName}` : `${displayName} details`);
  document.getElementById("menuDetailClose").setAttribute("aria-label", isArabic ? "إغلاق تفاصيل الطبق" : "Close dish details");
}

function openMenuDetail(itemId, opener) {
  const item = menuItems.find(candidate => candidate.id === itemId);
  if (!item) return;
  menuDetailItemId = itemId;
  menuDetailOpener = opener;
  populateMenuDetail(item);
  menuDetail.showModal();
  document.body.classList.add("is-locked");
}

menuGrid.addEventListener("click", event => {
  const card = event.target.closest(".menu-card");
  if (card) openMenuDetail(card.dataset.itemId, card);
});

menuGrid.addEventListener("keydown", event => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const card = event.target.closest(".menu-card");
  if (!card) return;
  event.preventDefault();
  openMenuDetail(card.dataset.itemId, card);
});

document.getElementById("menuDetailClose").addEventListener("click", () => menuDetail.close());
menuDetail.addEventListener("click", event => { if (event.target === menuDetail) menuDetail.close(); });
menuDetail.addEventListener("close", () => {
  document.body.classList.remove("is-locked");
  menuDetailOpener?.focus({ preventScroll: true });
  menuDetailItemId = null;
});

document.querySelectorAll("[data-category-link]").forEach(button => {
  button.addEventListener("click", () => chooseCategory(button.dataset.categoryLink, true));
});

// Mobile navigation: Escape, focus wrapping, and focus restoration are supported.
let navReturnFocus = null;
let navHideTimer = null;

function openMobileNav() {
  if (desktopMedia.matches) return;
  window.clearTimeout(navHideTimer);
  navReturnFocus = document.activeElement;
  mobileNav.hidden = false;
  document.body.classList.add("is-locked");
  siteHeader.classList.add("is-open");
  menuToggle.setAttribute("aria-expanded", "true");
  menuToggle.setAttribute("aria-label", currentLanguage === "ar" ? "إغلاق قائمة التنقل" : "Close navigation");
  requestAnimationFrame(() => {
    mobileNav.classList.add("is-open");
    mobileNav.querySelector("a")?.focus({ preventScroll: true });
  });
}

function closeMobileNav(restoreFocus = true) {
  if (mobileNav.hidden) return;
  window.clearTimeout(navHideTimer);
  mobileNav.classList.remove("is-open");
  siteHeader.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", currentLanguage === "ar" ? "فتح قائمة التنقل" : "Open navigation");
  document.body.classList.remove("is-locked");
  navHideTimer = window.setTimeout(() => { mobileNav.hidden = true; }, prefersReducedMotion.matches ? 0 : 250);
  if (restoreFocus && navReturnFocus instanceof HTMLElement) navReturnFocus.focus({ preventScroll: true });
}

menuToggle.addEventListener("click", () => {
  if (menuToggle.getAttribute("aria-expanded") === "true") closeMobileNav();
  else openMobileNav();
});

mobileNav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => closeMobileNav(false)));
desktopMedia.addEventListener("change", event => { if (event.matches) closeMobileNav(false); });

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !mobileNav.hidden) {
    event.preventDefault();
    closeMobileNav();
    return;
  }
  if (event.key !== "Tab" || mobileNav.hidden || desktopMedia.matches) return;
  const focusable = [menuToggle, ...mobileNav.querySelectorAll("a[href], button:not([disabled])")];
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

// Native dialog gallery with wraparound previous/next controls.
const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightboxImage");
const lightboxCaption = document.getElementById("lightboxCaption");
const galleryItems = [...document.querySelectorAll(".gallery-item")];
let galleryIndex = 0;
let galleryOpener = null;

function updateLightbox(index) {
  galleryIndex = (index + galleryItems.length) % galleryItems.length;
  const item = galleryItems[galleryIndex];
  const thumbnail = item.querySelector("img");
  lightboxImage.src = item.dataset.full;
  lightboxImage.alt = thumbnail?.alt || (currentLanguage === "ar" ? "صورة طعام" : "Food photo");
  const caption = item.dataset.caption || "Khan Al Harir food photography";
  lightboxCaption.textContent = currentLanguage === "ar"
    ? (galleryCaptionsAr.get(caption) || "صور أطعمة خان الحرير")
    : caption;
}

function openLightbox(index, opener) {
  galleryOpener = opener;
  updateLightbox(index);
  lightbox.showModal();
  document.body.classList.add("is-locked");
}

galleryItems.forEach((item, index) => item.addEventListener("click", () => openLightbox(index, item)));
document.getElementById("lightboxClose").addEventListener("click", () => lightbox.close());
document.getElementById("lightboxPrev").addEventListener("click", () => updateLightbox(galleryIndex - 1));
document.getElementById("lightboxNext").addEventListener("click", () => updateLightbox(galleryIndex + 1));
lightbox.addEventListener("click", event => { if (event.target === lightbox) lightbox.close(); });
lightbox.addEventListener("keydown", event => {
  if (event.key === "ArrowLeft") { event.preventDefault(); updateLightbox(galleryIndex - 1); }
  if (event.key === "ArrowRight") { event.preventDefault(); updateLightbox(galleryIndex + 1); }
});
lightbox.addEventListener("close", () => {
  document.body.classList.remove("is-locked");
  galleryOpener?.focus({ preventScroll: true });
});

// One local fallback covers every static or dynamically rendered food image.
document.addEventListener("error", event => {
  const image = event.target;
  if (!(image instanceof HTMLImageElement) || image.dataset.fallbackApplied) return;
  image.dataset.fallbackApplied = "true";
  image.src = "assets/image-fallback.svg";
  image.classList.add("has-fallback");
}, true);

// Header state and active desktop navigation.
function updateHeader() {
  siteHeader.classList.toggle("is-scrolled", window.scrollY > 24);
}
window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

const navSections = [...document.querySelectorAll("#menu, #about, #gallery, #contact")];
if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    document.querySelectorAll(".desktop-nav a").forEach(link => {
      const active = link.getAttribute("href") === `#${visible.target.id}`;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }, { rootMargin: "-25% 0px -60% 0px", threshold: [0, 0.1, 0.3] });
  navSections.forEach(section => sectionObserver.observe(section));
}

// Reveal content only when it can be observed; no-JS visitors see everything.
if ("IntersectionObserver" in window && !prefersReducedMotion.matches) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

  document.querySelectorAll(".cuisine-tile, .section-heading, .order-inner, .about-image-wrap, .about-copy, .gallery-item, .contact-grid > *").forEach((element, index) => {
    element.classList.add("reveal-prep");
    element.style.transitionDelay = `${(index % 3) * 45}ms`;
    revealObserver.observe(element);
  });
}

document.getElementById("year").textContent = new Date().getFullYear();
initializeStaticTranslations();
setLanguage(currentLanguage, false);
loadOfficialMenu();
window.setInterval(refreshOfficialMenuIfStale, MENU_REFRESH_INTERVAL_MS);
window.addEventListener("focus", refreshOfficialMenuIfStale);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) refreshOfficialMenuIfStale();
});

