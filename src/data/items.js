// Master item inventory.
// conditions: array of flags that must ALL be true in tripConfig for item to activate.
//   'always' = no condition needed
//   Quantity can be a number or a key string resolved by packingEngine.

// ─── TOPHER CLOTHING ──────────────────────────────────────────────────────────
export const TOPHER_CLOTHING = [
  { id: 't-navy-suit',       name: 'Navy Suit (jacket + pants)',       isHeavy: true,  conditions: ['isBusiness'],  qty: 1 },
  { id: 't-olive-suit',      name: 'Dark Olive Green Suit',            isHeavy: true,  conditions: ['isBusiness'],  qty: 1 },
  { id: 't-brown-suit',      name: 'Brown Suit (jacket + pants)',      isHeavy: true,  conditions: ['isBusiness'],  qty: 1 },
  { id: 't-linen-suit',      name: 'Tan Linen Suit',                   isHeavy: true,  conditions: ['isBusiness', 'isWarm'], qty: 1 },
  { id: 't-dress-shirts',    name: 'Dress Shirts (White ×2, Blue ×2, Patterned ×1, Extra ×1)', isHeavy: false, conditions: ['hasFormalDays'], qty: 'dressShirts' },
  { id: 't-ties',            name: 'Ties (3–4)',                       isHeavy: false, conditions: ['hasFormalDays'], qty: 'tiesTotal' },
  { id: 't-white-undershirts',name: 'White Undershirts',               isHeavy: false, conditions: ['hasFormalDays'], qty: 'formalDaysPlusOne' },
  { id: 't-dress-socks',     name: 'Dress Socks (brown)',              isHeavy: false, conditions: ['isMIPCOM'],    qty: 4 },
  { id: 't-black-belt',      name: 'Black Belt',                       isHeavy: false, conditions: ['isBusiness'],  qty: 1 },
  { id: 't-brown-belt',      name: 'Brown Belt',                       isHeavy: false, conditions: ['isBusiness'],  qty: 1 },
  { id: 't-collar-stays',    name: 'Collar Stays',                     isHeavy: false, conditions: ['isMIPCOM'],    qty: 1 },
  { id: 't-black-dress-shoes',name: 'Black Dress Shoes',               isHeavy: true,  conditions: ['isBusiness'],  qty: 1 },
  { id: 't-brown-dress-shoes',name: 'Brown Dress Shoes',               isHeavy: true,  conditions: ['isBusiness'],  qty: 1 },
  { id: 't-allbirds',        name: 'Allbirds Walking Shoes',           isHeavy: true,  conditions: ['always'],      qty: 1 },
  { id: 't-jeans',           name: 'Jeans',                            isHeavy: false, conditions: ['always'],      qty: 2 },
  { id: 't-casual-tshirts',  name: 'Casual V-Neck T-Shirts',          isHeavy: false, conditions: ['always'],      qty: 'casualTshirts' },
  { id: 't-pj-pants',        name: 'Pajama Pants',                     isHeavy: false, conditions: ['always'],      qty: 2 },
  { id: 't-exercise-leggings',name: 'Exercise Leggings',               isHeavy: false, conditions: ['always'],      qty: 2 },
  { id: 't-compression-shirt',name: 'Compression Shirt',               isHeavy: false, conditions: ['always'],      qty: 1 },
  { id: 't-compression-belt', name: 'Compression Belt',                isHeavy: false, conditions: ['always'],      qty: 1 },
  { id: 't-baseball-cap',    name: 'Baseball Cap',                     isHeavy: false, conditions: ['always'],      qty: 1 },
  { id: 't-fanny-pack',      name: 'Fanny Pack',                       isHeavy: false, conditions: ['always'],      qty: 1 },
  { id: 't-swim-trunks',     name: 'Swim Trunks',                      isHeavy: false, conditions: ['isBeach'],     qty: 1 },
  { id: 't-rain-jacket',     name: 'Rain Jacket',                      isHeavy: false, conditions: ['weatherDependent'], qty: 1, optional: true },
  { id: 't-waterproof-jacket',name: 'Heavy Duty Waterproof Jacket',    isHeavy: true,  conditions: ['isCold'],      qty: 1 },
  { id: 't-puffy-jacket',    name: 'Puffy Jacket',                     isHeavy: true,  conditions: ['isCold'],      qty: 1 },
  { id: 't-light-jacket',    name: 'Lightweight Jacket / Sweater',     isHeavy: false, conditions: ['always'],      qty: 1 },
  { id: 't-hoodie',          name: 'Hoodie',                           isHeavy: false, conditions: ['always'],      qty: 1 },
  { id: 't-face-cover',      name: 'Face Cover for Cold',              isHeavy: false, conditions: ['isCold'],      qty: 1 },
  { id: 't-beanie',          name: 'Knit Cap (Beanie)',                isHeavy: false, conditions: ['isCold'],      qty: 1 },
  { id: 't-hiking-pants',    name: 'Hiking Pants',                     isHeavy: false, conditions: ['isAdventure'], qty: 1 },
  { id: 't-wool-leggings',   name: 'Wool Leggings',                    isHeavy: false, conditions: ['isCold'],      qty: 1 },
  { id: 't-wp-phone-case',   name: 'Waterproof Phone Case',            isHeavy: false, conditions: ['isOutdoorWater'], qty: 1 },
  { id: 't-sunglasses',      name: 'Sunglasses',                       isHeavy: false, conditions: ['always'],      qty: 1 },
  { id: 't-boxer-briefs',    name: 'Boxer Briefs',                     isHeavy: false, conditions: ['always'],      qty: 'toperUnderwear' },
  { id: 't-wool-boxers',     name: 'Wool Boxer Briefs (flight day)',   isHeavy: false, conditions: ['isFlying'],    qty: 1 },
  { id: 't-compression-socks',name: 'Compression Socks',              isHeavy: false, conditions: ['isFlying'],    qty: 'compressionSocks' },
  { id: 't-ankle-socks',     name: 'Black Ankle Socks',               isHeavy: false, conditions: ['always'],      qty: 'tripDays' },
  { id: 't-laundry-bags',    name: 'Laundry Bags',                    isHeavy: false, conditions: ['always'],      qty: 1 },
]

// ─── TOPHER TOILETRIES ────────────────────────────────────────────────────────
export const TOPHER_TOILETRIES = [
  { id: 't-electric-toothbrush',  name: 'Electric Toothbrush + Charger', isHeavy: false, conditions: ['always'], qty: 1 },
  { id: 't-hair-gel',             name: 'Hair Gel',                       isHeavy: false, conditions: ['always'], qty: 1 },
  { id: 't-nose-trimmer',         name: 'Nose Hair Trimmer',              isHeavy: false, conditions: ['always'], qty: 1 },
  { id: 't-nose-edger',           name: 'Nose Hair Edging Trimmer',       isHeavy: false, conditions: ['always'], qty: 1 },
  { id: 't-nail-clippers',        name: 'Nail Clippers',                  isHeavy: false, conditions: ['always'], qty: 1 },
  { id: 't-electric-razor',       name: 'Electric Razor',                 isHeavy: false, conditions: ['always'], qty: 1 },
  { id: 't-razor-backup',         name: 'Razor + Shaving Cream (backup)', isHeavy: false, conditions: ['always'], qty: 1 },
  { id: 't-deodorant',            name: 'Deodorant',                      isHeavy: false, conditions: ['always'], qty: 1 },
  { id: 't-moisturizer',          name: 'Moisturizer',                    isHeavy: false, conditions: ['always'], qty: 1 },
  { id: 't-face-sunscreen',       name: 'Face Sunscreen',                 isHeavy: false, conditions: ['always'], qty: 1 },
  { id: 't-lens-wipes',           name: 'Lens Wipes',                     isHeavy: false, conditions: ['always'], qty: 1 },
  { id: 't-travel-shampoo',       name: 'Travel Shampoo',                 isHeavy: false, conditions: ['always'], qty: 1 },
  { id: 't-travel-conditioner',   name: 'Travel Conditioner',             isHeavy: false, conditions: ['always'], qty: 1 },
  { id: 't-travel-bodywash',      name: 'Travel Body Wash',               isHeavy: false, conditions: ['always'], qty: 1 },
]

// ─── TOPHER MEDICAL / SUPPLEMENTS ────────────────────────────────────────────
export const TOPHER_MEDICAL = [
  { id: 't-meds',              name: 'Personal Medications (daily)',     isHeavy: false, conditions: ['always'],    qty: 'tripDays' },
  { id: 't-ibuprofen',         name: 'Ibuprofen',                        isHeavy: false, conditions: ['always'],    qty: 1 },
  { id: 't-tums',              name: 'Tums',                             isHeavy: false, conditions: ['always'],    qty: 1 },
  { id: 't-sleeping-pills',    name: 'Sleeping Pills',                   isHeavy: false, conditions: ['always'],    qty: 1 },
  { id: 't-psyllium-fly',      name: 'Psyllium Husk (portioned Ziplocs)',isHeavy: false, conditions: ['isFlying'],  qty: 'supplementZiplocs', note: 'tripDays + 2 individual bags' },
  { id: 't-psyllium-drive',    name: 'Psyllium Husk (full container)',   isHeavy: false, conditions: ['isDriving'], qty: 1 },
  { id: 't-potato-starch-fly', name: 'Potato Starch (portioned Ziplocs)',isHeavy: false, conditions: ['isFlying'],  qty: 'supplementZiplocs', note: 'tripDays + 2 individual bags' },
  { id: 't-potato-starch-drive',name: 'Potato Starch (full container)', isHeavy: false, conditions: ['isDriving'], qty: 1 },
  { id: 't-creatine-fly',      name: 'Creatine (portioned Ziplocs)',     isHeavy: false, conditions: ['isFlying'],  qty: 'supplementZiplocs', note: 'tripDays + 2 individual bags' },
  { id: 't-creatine-drive',    name: 'Creatine (full container)',        isHeavy: false, conditions: ['isDriving'], qty: 1 },
  { id: 't-electrolytes',      name: 'Electrolyte Packets',              isHeavy: false, conditions: ['always'],    qty: 'tripDays' },
  { id: 't-chia-shots',        name: 'Chia Seed Shot Packets',           isHeavy: false, conditions: ['always'],    qty: 'chiaShotPackets', note: 'tripDays + 3' },
  { id: 't-chia-pouches',      name: 'Chia Seed Squeeze Pouches (backup)', isHeavy: false, conditions: ['always'], qty: 3 },
  { id: 't-sweet-n-low',       name: "Sweet 'n Low Packets",             isHeavy: false, conditions: ['always'],    qty: 1 },
  { id: 't-aso-ankle',         name: 'ASO Ankle Stabilizer',             isHeavy: false, conditions: ['always'],    qty: 1 },
  { id: 't-ankle-sleeve',      name: 'Ankle Brace Compression Sleeve',  isHeavy: false, conditions: ['always'],    qty: 1 },
]

// ─── TOPHER HYDRATION ─────────────────────────────────────────────────────────
export const TOPHER_HYDRATION = [
  { id: 't-water-bottle',       name: 'Water Bottle',              isHeavy: false, conditions: ['always'], qty: 1 },
  { id: 't-straw-cleaner',      name: 'Water Bottle Straw Cleaner',isHeavy: false, conditions: ['always'], qty: 1 },
]

// ─── TOPHER YOGURT (special — handled by task engine) ─────────────────────────
export const TOPHER_YOGURT = [
  { id: 't-yogurt-drive',  name: 'Chobani 20g Protein Greek Yogurt Drink (cooler over ice)', isHeavy: false, conditions: ['isDriving'], qty: 'tripDays' },
  // flying variants → Day 1 tasks, not packing items
]

// ─── TOPHER TECHNOLOGY ────────────────────────────────────────────────────────
export const TOPHER_TECH = [
  { id: 't-personal-iphone',  name: 'Personal iPhone + USB-C Cable',    isHeavy: false, conditions: ['always'],    qty: 1 },
  { id: 't-work-iphone',      name: 'Work iPhone + Lightning Cable',     isHeavy: false, conditions: ['isBusiness'],qty: 1 },
  { id: 't-ipad',             name: 'iPad + USB-C Cable',                isHeavy: false, conditions: ['always'],    qty: 1 },
  { id: 't-apple-watch',      name: 'Apple Watch + Charger',             isHeavy: false, conditions: ['always'],    qty: 1 },
  { id: 't-oura-ring',        name: 'Oura Ring + Charger',               isHeavy: false, conditions: ['always'],    qty: 1 },
  { id: 't-pavlok',           name: 'Pavlok 3 + USB-C',                  isHeavy: false, conditions: ['isBusiness'],qty: 1 },
  { id: 't-laptop',           name: 'Laptop + Charger',                  isHeavy: true,  conditions: ['isBusiness'],qty: 1 },
  { id: 't-apple-pencil',     name: 'Apple Pencil',                      isHeavy: false, conditions: ['always'],    qty: 1 },
  { id: 't-bose-headphones',  name: 'Bose Headphones 700 + USB-C',       isHeavy: false, conditions: ['always'],    qty: 1 },
  { id: 't-airpods',          name: 'AirPods Pro + Lightning',           isHeavy: false, conditions: ['always'],    qty: 1 },
  { id: 't-meta-quest',       name: 'Meta Quest 3 + USB-C + AA batteries',isHeavy: true, conditions: ['always'],    qty: 1, optional: true },
  { id: 't-rain-machine',     name: 'Portable Rain Machine + USB-B Mini',isHeavy: false, conditions: ['isBusiness'],qty: 1 },
]

// ─── TOPHER POWER ─────────────────────────────────────────────────────────────
export const TOPHER_POWER = [
  { id: 't-anker-charger',  name: 'Anker 60W 6-Port Charging Station', isHeavy: false, conditions: ['always'],        qty: 1 },
  { id: 't-portable-battery',name: 'Portable Battery + Cable',         isHeavy: false, conditions: ['always'],        qty: 1 },
  { id: 't-eu-adapter',     name: 'EU Plug Adapter',                   isHeavy: false, conditions: ['isInternational'], qty: 1 },
  { id: 't-uk-adapter',     name: 'UK Plug Adapter',                   isHeavy: false, conditions: ['isInternational'], qty: 1 },
]

// ─── TOPHER TRAVEL COMFORT ────────────────────────────────────────────────────
export const TOPHER_COMFORT = [
  { id: 't-eye-mask',       name: 'Eye Mask',               isHeavy: false, conditions: ['always'],  qty: 1 },
  { id: 't-travel-pillow',  name: 'Travel Pillow',           isHeavy: false, conditions: ['isFlying'],qty: 1 },
  { id: 't-books',          name: 'Books / Reading Material',isHeavy: false, conditions: ['always'],  qty: 1 },
  { id: 't-flight-snacks',  name: 'Snacks for Flight',       isHeavy: false, conditions: ['isFlying'],qty: 1 },
  { id: 't-umbrella',       name: 'Portable Umbrella',       isHeavy: false, conditions: ['always'],  qty: 1 },
]

// ─── TOPHER DOCUMENTS ─────────────────────────────────────────────────────────
export const TOPHER_DOCUMENTS = [
  { id: 't-passport',          name: 'Passport',               isHeavy: false, conditions: ['isInternational'], qty: 1 },
  { id: 't-drivers-license',   name: "Driver's License",       isHeavy: false, conditions: ['always'],           qty: 1 },
  { id: 't-wallet',            name: 'Wallet',                 isHeavy: false, conditions: ['always'],           qty: 1 },
  { id: 't-boarding-passes',   name: 'Boarding Passes',        isHeavy: false, conditions: ['isFlying'],         qty: 1 },
  { id: 't-flight-itinerary',  name: 'Flight Itinerary',       isHeavy: false, conditions: ['isFlying'],         qty: 1 },
  { id: 't-hotel-confirmations',name: 'Hotel Confirmations',   isHeavy: false, conditions: ['always'],           qty: 1 },
  { id: 't-receipts-bag',      name: 'Resealable Bag for Receipts', isHeavy: false, conditions: ['always'],      qty: 1 },
]

// ─── LA NITA CLOTHING ─────────────────────────────────────────────────────────
export const LANITA_CLOTHING = [
  { id: 'l-swimwear',       name: 'Swimwear',                      isHeavy: false, conditions: ['isBeach'],  qty: '2-3' },
  { id: 'l-coverups',       name: 'Cover-Ups',                     isHeavy: false, conditions: ['isBeach'],  qty: '1-2' },
  { id: 'l-tshirts',        name: 'T-Shirts / Tank Tops / Blouses',isHeavy: false, conditions: ['always'],   qty: 'lanitaTshirts' },
  { id: 'l-shorts-skirts',  name: 'Shorts / Skirts',               isHeavy: false, conditions: ['always'],   qty: '3-4' },
  { id: 'l-pants-jeans',    name: 'Lightweight Pants / Jeans',     isHeavy: false, conditions: ['always'],   qty: 2 },
  { id: 'l-dresses',        name: 'Dresses',                       isHeavy: false, conditions: ['always'],   qty: '2-3' },
  { id: 'l-underwear',      name: 'Underwear',                     isHeavy: false, conditions: ['always'],   qty: 'lanitaUnderwear' },
  { id: 'l-socks',          name: 'Socks',                         isHeavy: false, conditions: ['always'],   qty: 'tripDays' },
  { id: 'l-pajamas',        name: 'Pajamas',                       isHeavy: false, conditions: ['always'],   qty: '2-3' },
  { id: 'l-light-jacket',   name: 'Light Jacket',                  isHeavy: false, conditions: ['always'],   qty: 1 },
  { id: 'l-sandals',        name: 'Sandals / Flip-Flops',          isHeavy: false, conditions: ['isBeach'],  qty: 1 },
  { id: 'l-walking-shoes',  name: 'Walking Shoes',                 isHeavy: false, conditions: ['always'],   qty: 1 },
  { id: 'l-hat',            name: 'Hat / Cap',                     isHeavy: false, conditions: ['always'],   qty: 1 },
  { id: 'l-sunglasses',     name: 'Sunglasses',                    isHeavy: false, conditions: ['always'],   qty: 1 },
]

// ─── LA NITA TOILETRIES ───────────────────────────────────────────────────────
export const LANITA_TOILETRIES = [
  { id: 'l-toothbrush',       name: 'Toothbrush + Toothpaste',     isHeavy: false, conditions: ['always'],  qty: 1 },
  { id: 'l-shampoo-cond',     name: 'Shampoo + Conditioner',       isHeavy: false, conditions: ['always'],  qty: 1 },
  { id: 'l-bodywash',         name: 'Body Wash',                   isHeavy: false, conditions: ['always'],  qty: 1 },
  { id: 'l-deodorant',        name: 'Deodorant',                   isHeavy: false, conditions: ['always'],  qty: 1 },
  { id: 'l-hairbrush',        name: 'Hairbrush / Comb',            isHeavy: false, conditions: ['always'],  qty: 1 },
  { id: 'l-hair-ties',        name: 'Hair Ties / Clips',           isHeavy: false, conditions: ['always'],  qty: 1 },
  { id: 'l-makeup',           name: 'Makeup + Remover',            isHeavy: false, conditions: ['always'],  qty: 1 },
  { id: 'l-moisturizer',      name: 'Moisturizer',                 isHeavy: false, conditions: ['always'],  qty: 1 },
  { id: 'l-sunscreen',        name: 'Sunscreen (high SPF)',        isHeavy: false, conditions: ['always'],  qty: 1 },
  { id: 'l-lip-balm',         name: 'Lip Balm with SPF',           isHeavy: false, conditions: ['always'],  qty: 1 },
  { id: 'l-aftersun',         name: 'After-Sun Lotion',            isHeavy: false, conditions: ['isBeach'], qty: 1 },
  { id: 'l-meds',             name: 'Personal Medications',        isHeavy: false, conditions: ['always'],  qty: 'tripDays' },
  { id: 'l-razor',            name: 'Razor + Shaving Cream',       isHeavy: false, conditions: ['always'],  qty: 1 },
]

// ─── LA NITA MISC ─────────────────────────────────────────────────────────────
export const LANITA_MISC = [
  { id: 'l-phone-charger',  name: 'Phone + Charger',         isHeavy: false, conditions: ['always'],  qty: 1 },
  { id: 'l-books',          name: 'Books / E-Reader',        isHeavy: false, conditions: ['always'],  qty: 1 },
  { id: 'l-travel-docs',    name: 'Travel Documents',        isHeavy: false, conditions: ['always'],  qty: 1 },
  { id: 'l-wallet',         name: 'Wallet',                  isHeavy: false, conditions: ['always'],  qty: 1 },
  { id: 'l-water-bottle',   name: 'Water Bottle',            isHeavy: false, conditions: ['always'],  qty: 1 },
  { id: 'l-beach-towel',    name: 'Beach Towel',             isHeavy: false, conditions: ['isBeach'], qty: 1 },
  { id: 'l-day-bag',        name: 'Small Backpack / Day Bag',isHeavy: false, conditions: ['always'],  qty: 1 },
]

// ─── CROSBY CLOTHING ──────────────────────────────────────────────────────────
export const CROSBY_CLOTHING = [
  { id: 'c-swimwear',       name: 'Swimwear',               isHeavy: false, conditions: ['isBeach'],  qty: 2 },
  { id: 'c-tshirts',        name: 'T-Shirts',               isHeavy: false, conditions: ['always'],   qty: 'crosbyTshirts' },
  { id: 'c-shorts',         name: 'Shorts',                 isHeavy: false, conditions: ['always'],   qty: '3-4' },
  { id: 'c-pants',          name: 'Lightweight Pants',      isHeavy: false, conditions: ['always'],   qty: 2 },
  { id: 'c-pajamas',        name: 'Pajamas',                isHeavy: false, conditions: ['always'],   qty: '2-3' },
  { id: 'c-underwear',      name: 'Underwear',              isHeavy: false, conditions: ['always'],   qty: 'crosbyUnderwear' },
  { id: 'c-socks',          name: 'Socks',                  isHeavy: false, conditions: ['always'],   qty: 'tripDays' },
  { id: 'c-light-jacket',   name: 'Light Jacket',           isHeavy: false, conditions: ['always'],   qty: 1 },
  { id: 'c-sandals',        name: 'Sandals',                isHeavy: false, conditions: ['isBeach'],  qty: 1 },
  { id: 'c-walking-shoes',  name: 'Walking Shoes',          isHeavy: false, conditions: ['always'],   qty: 1 },
  { id: 'c-hat',            name: 'Hat',                    isHeavy: false, conditions: ['always'],   qty: 1 },
  { id: 'c-sunglasses',     name: 'Sunglasses',             isHeavy: false, conditions: ['always'],   qty: 1 },
]

// ─── CROSBY TOILETRIES ────────────────────────────────────────────────────────
export const CROSBY_TOILETRIES = [
  { id: 'c-toothbrush',  name: 'Toothbrush + Toothpaste',       isHeavy: false, conditions: ['always'],  qty: 1 },
  { id: 'c-shampoo',     name: "Kids' Shampoo + Body Wash",      isHeavy: false, conditions: ['always'],  qty: 1 },
  { id: 'c-sunscreen',   name: 'Sunscreen (kid-friendly)',       isHeavy: false, conditions: ['always'],  qty: 1 },
  { id: 'c-lip-balm',    name: 'Lip Balm with SPF',              isHeavy: false, conditions: ['always'],  qty: 1 },
  { id: 'c-aftersun',    name: 'After-Sun Lotion',               isHeavy: false, conditions: ['isBeach'], qty: 1 },
  { id: 'c-meds',        name: 'Personal Medications',           isHeavy: false, conditions: ['always'],  qty: 1 },
]

// ─── CROSBY MISC ──────────────────────────────────────────────────────────────
export const CROSBY_MISC = [
  { id: 'c-toys',         name: 'Favorite Toys / Stuffed Animals',isHeavy: false, conditions: ['always'],  qty: '2-3' },
  { id: 'c-books',        name: 'Books / Activity Books',         isHeavy: false, conditions: ['always'],  qty: '2-3' },
  { id: 'c-tablet',       name: 'Tablet + Headphones',           isHeavy: false, conditions: ['always'],  qty: 1 },
  { id: 'c-travel-snacks',name: 'Snacks for Travel',             isHeavy: false, conditions: ['always'],  qty: 1 },
  { id: 'c-water-bottle', name: 'Water Bottle',                  isHeavy: false, conditions: ['always'],  qty: 1 },
  { id: 'c-floaties',     name: 'Floaties / Swim Aids',          isHeavy: false, conditions: ['isBeach'], qty: 1 },
  { id: 'c-beach-toys',   name: 'Beach Toys',                    isHeavy: false, conditions: ['isBeach'], qty: 1 },
  { id: 'c-beach-towel',  name: 'Beach Towel',                   isHeavy: false, conditions: ['isBeach'], qty: 1 },
  { id: 'c-backpack',     name: 'Small Backpack',                isHeavy: false, conditions: ['always'],  qty: 1 },
]

// ─── PENN CLOTHING ────────────────────────────────────────────────────────────
export const PENN_CLOTHING = [
  { id: 'p-onesies',       name: 'Onesies / Rompers',         isHeavy: false, conditions: ['always'],  qty: 'pennOnesies' },
  { id: 'p-swimsuit-hat',  name: 'Swimsuit + Sun Hat sets',   isHeavy: false, conditions: ['isBeach'], qty: 2 },
  { id: 'p-pants-shorts',  name: 'Lightweight Pants / Shorts',isHeavy: false, conditions: ['always'],  qty: '3-4' },
  { id: 'p-pajamas',       name: 'Pajamas',                   isHeavy: false, conditions: ['always'],  qty: 'pennPajamas' },
  { id: 'p-socks',         name: 'Socks',                     isHeavy: false, conditions: ['always'],  qty: 'pennSocks' },
  { id: 'p-light-jacket',  name: 'Light Jacket',              isHeavy: false, conditions: ['always'],  qty: 1 },
  { id: 'p-bibs',          name: 'Bibs',                      isHeavy: false, conditions: ['pennInfantToddler'], qty: 'pennBibs' },
]

// ─── PENN — INFANT (age < 2) ──────────────────────────────────────────────────
export const PENN_INFANT = [
  { id: 'p-diapers',        name: 'Diapers',               isHeavy: false, conditions: ['pennInfant'],  qty: 'pennDiapers' },
  { id: 'p-swim-diapers',   name: 'Swim Diapers',          isHeavy: false, conditions: ['pennInfant', 'isBeach'], qty: 1 },
  { id: 'p-wipes',          name: 'Wipes',                  isHeavy: false, conditions: ['pennInfant'],  qty: 1 },
  { id: 'p-diaper-cream',   name: 'Diaper Cream',           isHeavy: false, conditions: ['pennInfant'],  qty: 1 },
  { id: 'p-baby-shampoo',   name: 'Baby Shampoo',           isHeavy: false, conditions: ['pennInfant'],  qty: 1 },
  { id: 'p-baby-lotion',    name: 'Baby Lotion',            isHeavy: false, conditions: ['pennInfant'],  qty: 1 },
  { id: 'p-baby-sunscreen', name: 'Baby Sunscreen',         isHeavy: false, conditions: ['pennInfant'],  qty: 1 },
  { id: 'p-bottles',        name: 'Bottles',                isHeavy: false, conditions: ['pennInfant'],  qty: 1 },
  { id: 'p-formula',        name: 'Formula / Baby Food',    isHeavy: false, conditions: ['pennInfant'],  qty: 1 },
  { id: 'p-sippy-cups-inf', name: 'Sippy Cups',             isHeavy: false, conditions: ['pennInfant'],  qty: 2 },
  { id: 'p-portable-highchair', name: 'Portable High Chair',isHeavy: false, conditions: ['pennInfant'],  qty: 1 },
  { id: 'p-teething-toys',  name: 'Teething Toys',          isHeavy: false, conditions: ['pennInfant'],  qty: 1 },
  { id: 'p-baby-monitor',   name: 'Baby Monitor',           isHeavy: false, conditions: ['pennInfant'],  qty: 1 },
  { id: 'p-pack-n-play',    name: 'Pack n Play (confirm at destination)', isHeavy: false, conditions: ['pennInfant'], qty: 1 },
]

// ─── PENN — TODDLER (age 2–3) ─────────────────────────────────────────────────
export const PENN_TODDLER = [
  { id: 'p-pull-ups',       name: 'Pull-Ups or Underwear',   isHeavy: false, conditions: ['pennToddler'], qty: 'tripDays' },
  { id: 'p-wipes-todd',     name: 'Wipes',                   isHeavy: false, conditions: ['pennToddler'], qty: 1 },
  { id: 'p-kid-shampoo-todd',name: 'Kid Shampoo',            isHeavy: false, conditions: ['pennToddler'], qty: 1 },
  { id: 'p-kid-sunscreen-todd',name: 'Kid Sunscreen',        isHeavy: false, conditions: ['pennToddler'], qty: 1 },
  { id: 'p-sippy-cups-todd',name: 'Sippy Cups',              isHeavy: false, conditions: ['pennToddler'], qty: 2 },
  { id: 'p-booster-seat',   name: 'Booster Seat',            isHeavy: false, conditions: ['pennToddler'], qty: 1 },
  { id: 'p-potty-items',    name: 'Potty Training Items (if applicable)', isHeavy: false, conditions: ['pennToddler'], qty: 1 },
]

// ─── PENN — YOUNG CHILD (age >= 3) ────────────────────────────────────────────
export const PENN_CHILD = [
  { id: 'p-underwear-child',  name: 'Underwear',           isHeavy: false, conditions: ['pennChild'], qty: 'pennUnderwear' },
  { id: 'p-kid-toiletries',   name: 'Kid Toiletries',      isHeavy: false, conditions: ['pennChild'], qty: 1 },
]

// ─── PENN GEAR ────────────────────────────────────────────────────────────────
export const PENN_GEAR = [
  { id: 'p-stroller',        name: 'Stroller',                         isHeavy: false, conditions: ['pennInfantToddler'], qty: 1 },
  { id: 'p-baby-carrier',    name: 'Baby Carrier',                     isHeavy: false, conditions: ['pennInfant'],         qty: 1 },
  { id: 'p-blankets',        name: 'Blankets',                         isHeavy: false, conditions: ['always'],             qty: '2-3' },
  { id: 'p-toys-comfort',    name: 'Favorite Toys / Comfort Items',    isHeavy: false, conditions: ['always'],             qty: '2-3' },
  { id: 'p-beach-tent',      name: 'Beach Tent / Shade Umbrella',      isHeavy: false, conditions: ['isBeach'],            qty: 1 },
  { id: 'p-beach-towel',     name: 'Beach Towel',                      isHeavy: false, conditions: ['isBeach'],            qty: 1 },
]

// ─── FAMILY SHARED ESSENTIALS ─────────────────────────────────────────────────
export const FAMILY_SHARED = [
  { id: 's-first-aid',        name: 'First Aid Kit',                   isHeavy: false, conditions: ['always'],   qty: 1 },
  { id: 's-laundry-bags',     name: 'Laundry Bags',                    isHeavy: false, conditions: ['always'],   qty: '1-2' },
  { id: 's-beach-bag',        name: 'Beach Bag',                       isHeavy: false, conditions: ['isBeach'],  qty: 1 },
  { id: 's-cooler-bag',       name: 'Cooler Bag',                      isHeavy: false, conditions: ['isBeachOrDriving'], qty: 1 },
  { id: 's-bug-spray',        name: 'Bug Spray',                       isHeavy: false, conditions: ['isOutdoor'],qty: 1 },
  { id: 's-hand-sanitizer',   name: 'Hand Sanitizer',                  isHeavy: false, conditions: ['always'],   qty: 1 },
  { id: 's-disinfecting-wipes',name: 'Disinfecting Wipes',             isHeavy: false, conditions: ['always'],   qty: 1 },
  { id: 's-travel-snacks',    name: 'Snacks for Travel',               isHeavy: false, conditions: ['always'],   qty: 1 },
  { id: 's-ziploc-bags',      name: 'Ziploc Bags (large)',             isHeavy: false, conditions: ['always'],   qty: 1 },
]

// ─── FULL INVENTORY MAP ────────────────────────────────────────────────────────
export const ALL_ITEMS = {
  topher: {
    clothing:    TOPHER_CLOTHING,
    toiletries:  TOPHER_TOILETRIES,
    medical:     TOPHER_MEDICAL,
    hydration:   TOPHER_HYDRATION,
    yogurt:      TOPHER_YOGURT,
    technology:  TOPHER_TECH,
    power:       TOPHER_POWER,
    comfort:     TOPHER_COMFORT,
    documents:   TOPHER_DOCUMENTS,
  },
  lanita: {
    clothing:    LANITA_CLOTHING,
    toiletries:  LANITA_TOILETRIES,
    misc:        LANITA_MISC,
  },
  crosby: {
    clothing:    CROSBY_CLOTHING,
    toiletries:  CROSBY_TOILETRIES,
    misc:        CROSBY_MISC,
  },
  penn: {
    clothing:    PENN_CLOTHING,
    infant:      PENN_INFANT,
    toddler:     PENN_TODDLER,
    child:       PENN_CHILD,
    gear:        PENN_GEAR,
  },
  shared: {
    essentials:  FAMILY_SHARED,
  },
}
