// Sample data ported from aabshar-v7.html. Replace with the real catalogue and dealer records.

export type FinishId = "chrome" | "black" | "gold" | "gunmetal" | "c_green" | "c_white" | "c_blue" | "c_black" | "c_yellow" | "c_red" | "c_grey";

export type Finish = { label: string; mult: number };

export type Product = {
  id: string;
  name: string;
  cat: string;
  /** Product photo. Products without one are shown as a crop of a room photo. */
  img?: string;
  /** Second photo shown on card hover. */
  alt?: string;
  /** CSS object-position for img. */
  pos?: string;
  /** background-position of the crop inside cimg (or the default room photo). */
  crop?: string;
  cimg?: string;
  price: number;
  /** Struck-through old price, 0 when none. */
  was: number;
  /** Pieces per carton, bundle or tank. */
  carton: number;
  /** Dealer price per piece for 1–4, 5–19 and 20+ cartons. */
  slabs: [number, number, number];
  flag?: string;
  sale?: boolean;
  fins: FinishId[];
  specs: string[];
  /** Plastic tab: tanks, pipes or home. */
  pt?: "tanks" | "pipes" | "home";
  pack?: "carton" | "bundle" | "tank";
  sub?: string;
  wty?: string;
  tags?: string;
};

/** [productId, x%, y%, finish] hotspot on a room photo. */
export type LookItem = [string, number, number, FinishId?];
export type Look = { name: string; mood: string; img: string; pos: string; items: LookItem[] };

export const FIN: Record<FinishId, Finish> = {
  "chrome": {
    "label": "Chrome",
    "mult": 1
  },
  "black": {
    "label": "Matt black",
    "mult": 1.1
  },
  "gold": {
    "label": "Brushed gold",
    "mult": 1.4
  },
  "gunmetal": {
    "label": "Gunmetal",
    "mult": 1.25
  },
  "c_green": {
    "label": "Green",
    "mult": 1
  },
  "c_white": {
    "label": "White",
    "mult": 1
  },
  "c_blue": {
    "label": "Blue",
    "mult": 1
  },
  "c_black": {
    "label": "Black",
    "mult": 1
  },
  "c_yellow": {
    "label": "Yellow",
    "mult": 1
  },
  "c_red": {
    "label": "Red",
    "mult": 1
  },
  "c_grey": {
    "label": "Grey",
    "mult": 1
  }
};

export const METAL: FinishId[] = [
  "chrome",
  "black",
  "gold",
  "gunmetal"
];

export const CATALOG: Product[] = [
  {
    "id": "AB-1204",
    "name": "Minimal basin mixer",
    "cat": "Taps & Mixers",
    "img": "/img/p-tap.jpg",
    "alt": "/img/vanity-brass.jpg",
    "pos": "62% 50%",
    "price": 8500,
    "was": 9900,
    "carton": 10,
    "slabs": [
      6900,
      6600,
      6400
    ],
    "flag": "−14%",
    "sale": true,
    "fins": [
      "gold",
      "chrome",
      "black",
      "gunmetal"
    ],
    "specs": [
      "Lead-free brass body",
      "35 mm ceramic cartridge",
      "½″ BSP, two 40 cm hoses included"
    ]
  },
  {
    "id": "AB-5102",
    "name": "Square rain shower 10″",
    "cat": "Showers",
    "img": "/img/p-shower.jpg",
    "alt": "/img/rain-walnut.jpg",
    "pos": "50% 30%",
    "price": 6200,
    "was": 7000,
    "carton": 8,
    "slabs": [
      4900,
      4700,
      4500
    ],
    "flag": "New",
    "fins": [
      "chrome",
      "black",
      "gold"
    ],
    "specs": [
      "10″ square head, silicone nozzles",
      "Wipe-clean against limescale",
      "40 cm wall arm included"
    ]
  },
  {
    "id": "AB-3310",
    "name": "Muslim shower set, 1.2 m hose",
    "cat": "Muslim Showers",
    "img": "/img/hand-black.jpg",
    "alt": "/img/hand-gold.jpg",
    "pos": "50% 30%",
    "price": 1950,
    "was": 0,
    "carton": 20,
    "slabs": [
      1500,
      1400,
      1320
    ],
    "flag": "Top seller",
    "fins": [
      "black",
      "chrome"
    ],
    "specs": [
      "Trigger spray with soft flow",
      "1.2 m stainless steel hose",
      "Wall holder included"
    ]
  },
  {
    "id": "AB-6120",
    "name": "Multi-spray hand shower kit",
    "cat": "Showers",
    "img": "/img/p-hand.jpg",
    "alt": "/img/bath.jpg",
    "pos": "50% 35%",
    "price": 4800,
    "was": 5400,
    "carton": 12,
    "slabs": [
      3800,
      3650,
      3500
    ],
    "flag": "",
    "fins": [
      "gold",
      "chrome"
    ],
    "specs": [
      "5 spray patterns",
      "1.5 m hose with wall elbow",
      "Solid brass bracket"
    ]
  },
  {
    "id": "AB-1410",
    "name": "Widespread basin mixer, 3-hole",
    "cat": "Taps & Mixers",
    "crop": "26% 45%",
    "price": 14500,
    "was": 0,
    "carton": 6,
    "slabs": [
      11800,
      11300,
      10900
    ],
    "fins": [
      "gold",
      "chrome"
    ],
    "specs": [
      "3-hole fitting, 8″ spread",
      "Cross-lever handles",
      "Pop-up waste included"
    ]
  },
  {
    "id": "AB-1206",
    "name": "Tall single-hole basin mixer",
    "cat": "Taps & Mixers",
    "crop": "49.5% 46%",
    "price": 9800,
    "was": 0,
    "carton": 8,
    "slabs": [
      7900,
      7600,
      7300
    ],
    "fins": [
      "gold",
      "chrome",
      "black"
    ],
    "specs": [
      "Tall body for deep basins",
      "Swivel spout",
      "Single lever, hot and cold"
    ]
  },
  {
    "id": "AB-8800",
    "name": "Floor-standing bath filler",
    "cat": "Taps & Mixers",
    "crop": "84% 52%",
    "price": 38000,
    "was": 0,
    "carton": 2,
    "slabs": [
      31500,
      30500,
      29500
    ],
    "fins": [
      "gold",
      "chrome",
      "black"
    ],
    "specs": [
      "Floor-mounted, 105 cm tall",
      "Hand shower and holder",
      "Concealed floor kit included"
    ]
  },
  {
    "id": "AB-7720",
    "name": "Angle valve ½″, quarter turn",
    "cat": "Valves & Fittings",
    "img": "/img/valves.jpg",
    "price": 450,
    "was": 0,
    "carton": 50,
    "slabs": [
      340,
      320,
      300
    ],
    "fins": [
      "chrome",
      "gold"
    ],
    "specs": [
      "Brass body, ceramic disc",
      "Quarter turn, no drips",
      "½″ × ½″ BSP"
    ]
  },
  {
    "id": "AB-9001",
    "name": "Wall-hung commode, soft-close seat",
    "cat": "Commodes",
    "img": "/img/wc.jpg",
    "price": 42000,
    "was": 0,
    "carton": 1,
    "slabs": [
      35500,
      34800,
      34000
    ],
    "fins": [],
    "specs": [
      "Rimless bowl, easy to clean",
      "Soft-close seat",
      "Fits standard concealed frames"
    ]
  },
  {
    "id": "AB-4402",
    "name": "Pull-down kitchen mixer",
    "cat": "Kitchen",
    "img": "/img/kitchen.jpg",
    "price": 12500,
    "was": 0,
    "carton": 6,
    "slabs": [
      10200,
      9800,
      9500
    ],
    "fins": [
      "black",
      "chrome"
    ],
    "specs": [
      "Pull-down spray, 2 modes",
      "360° swivel",
      "Single lever"
    ]
  },
  {
    "id": "AB-2210",
    "name": "Round counter basin",
    "cat": "Basins",
    "img": "/img/basin.jpg",
    "price": 16000,
    "was": 0,
    "carton": 2,
    "slabs": [
      13000,
      12600,
      12200
    ],
    "fins": [],
    "specs": [
      "Vitreous china, 42 cm",
      "Glazed inside and out",
      "Pairs with AB-1206"
    ]
  },
  {
    "id": "AB-2220",
    "name": "Undermount basin, 50 cm",
    "cat": "Basins",
    "cimg": "/img/look-walnut.jpg",
    "crop": "70% 77%",
    "price": 9500,
    "was": 0,
    "carton": 4,
    "slabs": [
      7600,
      7300,
      7000
    ],
    "fins": [],
    "specs": [
      "Vitreous china, 50 × 36 cm",
      "Fits under marble or quartz tops",
      "Overflow and clips included"
    ]
  },
  {
    "id": "AB-2300",
    "name": "Oak vanity with marble top, 80 cm",
    "cat": "Vanity units",
    "cimg": "/img/look-walnut.jpg",
    "crop": "23% 89%",
    "price": 68000,
    "was": 0,
    "carton": 1,
    "slabs": [
      57500,
      56000,
      54500
    ],
    "fins": [],
    "specs": [
      "Solid oak frame, soft-close drawers",
      "Marble top cut for one basin",
      "Moisture-sealed finish"
    ]
  },
  {
    "id": "AB-2310",
    "name": "Floating oak vanity, 120 cm double",
    "cat": "Vanity units",
    "cimg": "/img/look-black.jpg",
    "crop": "68% 72%",
    "price": 96000,
    "was": 0,
    "carton": 1,
    "slabs": [
      81500,
      79500,
      77500
    ],
    "fins": [],
    "specs": [
      "Wall-hung, two deep drawers",
      "Black quartz top with two basins",
      "Hidden wall brackets included"
    ]
  },
  {
    "id": "AB-6510",
    "name": "Matt black towel rail, 60 cm",
    "cat": "Accessories",
    "cimg": "/img/look-black.jpg",
    "crop": "36% 38.5%",
    "price": 2900,
    "was": 0,
    "carton": 20,
    "slabs": [
      2250,
      2150,
      2050
    ],
    "fins": [
      "black",
      "chrome",
      "gold"
    ],
    "specs": [
      "Solid brass, 60 cm bar",
      "Hidden screws",
      "Matches AB-1206"
    ]
  },
  {
    "id": "AB-9120",
    "name": "Freestanding bath, 170 cm",
    "cat": "Baths",
    "cimg": "/img/look-copper.jpg",
    "crop": "66% 66%",
    "price": 145000,
    "was": 0,
    "carton": 1,
    "slabs": [
      124000,
      121000,
      118000
    ],
    "fins": [],
    "specs": [
      "Cast stone, 170 × 80 cm",
      "Keeps water warm longer",
      "Pairs with AB-8800 filler"
    ]
  },
  {
    "id": "AB-4500",
    "name": "Stainless steel kitchen sink, 60 × 45 cm",
    "cat": "Kitchen",
    "cimg": "/img/look-kitchen.jpg",
    "crop": "46% 55%",
    "price": 18500,
    "was": 0,
    "carton": 2,
    "slabs": [
      15000,
      14500,
      14000
    ],
    "fins": [],
    "specs": [
      "1.2 mm 304 stainless steel",
      "Sound pads underneath",
      "Top-mount or flush-mount"
    ]
  },
  {
    "id": "AP-T300",
    "pt": "tanks",
    "name": "Triple-layer water tank, 300 gal",
    "cat": "Water Tanks",
    "img": "/img/tank.jpg",
    "pos": "62% 40%",
    "price": 21500,
    "was": 0,
    "carton": 1,
    "pack": "tank",
    "slabs": [
      18600,
      18000,
      17400
    ],
    "fins": [
      "c_green",
      "c_white",
      "c_blue"
    ],
    "sub": "1,364 litres · 3 layers",
    "wty": "10-year tank warranty",
    "tags": "plastic tanki",
    "specs": [
      "3 layers, food-grade white inner",
      "UV-stabilised outer layer",
      "Lockable lid, 1″ inlet and outlet"
    ]
  },
  {
    "id": "AP-T500",
    "pt": "tanks",
    "name": "Triple-layer water tank, 500 gal",
    "cat": "Water Tanks",
    "img": "/img/tank.jpg",
    "pos": "78% 40%",
    "alt": "/img/plastic-tanks.jpg",
    "price": 32000,
    "was": 35000,
    "carton": 1,
    "pack": "tank",
    "slabs": [
      27600,
      26800,
      26000
    ],
    "fins": [
      "c_green",
      "c_white",
      "c_blue"
    ],
    "flag": "Top seller",
    "sub": "2,273 litres · 3 layers",
    "wty": "10-year tank warranty",
    "tags": "plastic tanki",
    "specs": [
      "3 layers, food-grade white inner",
      "UV-stabilised outer layer",
      "Lockable lid, 1″ inlet and outlet"
    ]
  },
  {
    "id": "AP-T1000",
    "pt": "tanks",
    "name": "Four-layer water tank, 1000 gal",
    "cat": "Water Tanks",
    "img": "/img/plastic-tanks.jpg",
    "pos": "18% 45%",
    "price": 61000,
    "was": 0,
    "carton": 1,
    "pack": "tank",
    "slabs": [
      52500,
      51000,
      49500
    ],
    "fins": [
      "c_green",
      "c_white",
      "c_black"
    ],
    "flag": "4 layers",
    "sub": "4,546 litres · 4 layers",
    "wty": "15-year tank warranty",
    "tags": "plastic tanki",
    "specs": [
      "4 layers with foam insulation",
      "Water stays cooler in summer",
      "Lockable lid, 1¼″ outlet"
    ]
  },
  {
    "id": "AP-T1500",
    "pt": "tanks",
    "name": "Four-layer water tank, 1500 gal",
    "cat": "Water Tanks",
    "img": "/img/plastic-tanks.jpg",
    "pos": "70% 45%",
    "price": 88000,
    "was": 0,
    "carton": 1,
    "pack": "tank",
    "slabs": [
      76000,
      74000,
      72000
    ],
    "fins": [
      "c_green",
      "c_white",
      "c_black"
    ],
    "sub": "6,819 litres · 4 layers",
    "wty": "15-year tank warranty",
    "tags": "plastic tanki",
    "specs": [
      "4 layers with foam insulation",
      "For plazas, schools and large homes",
      "Two outlets, 1½″"
    ]
  },
  {
    "id": "AP-2040",
    "pt": "pipes",
    "name": "uPVC pressure pipe 4″, 13 ft",
    "cat": "Pipes",
    "img": "/img/pipes-grey.jpg",
    "pos": "50% 50%",
    "alt": "/img/pipes-wall.jpg",
    "price": 1850,
    "was": 0,
    "carton": 10,
    "pack": "bundle",
    "slabs": [
      1480,
      1420,
      1360
    ],
    "fins": [
      "c_grey"
    ],
    "sub": "110 mm · Class C",
    "wty": "Pressure-tested pipe",
    "tags": "plastic pvc",
    "specs": [
      "Class C pressure rating",
      "Solvent-weld socket on one end",
      "For main lines and drainage"
    ]
  },
  {
    "id": "AP-2020",
    "pt": "pipes",
    "name": "PPR hot & cold pipe ½″, 4 m",
    "cat": "Pipes",
    "img": "/img/pipes-wall.jpg",
    "pos": "40% 50%",
    "price": 420,
    "was": 0,
    "carton": 50,
    "pack": "bundle",
    "slabs": [
      330,
      315,
      300
    ],
    "fins": [
      "c_white",
      "c_green"
    ],
    "flag": "For geysers",
    "sub": "20 mm · PN20",
    "wty": "25-year pipe warranty",
    "tags": "plastic ppr",
    "specs": [
      "PN20, safe for geyser hot water",
      "Heat-fused joints, no leaks",
      "Pairs with AB-7720 angle valves"
    ]
  },
  {
    "id": "AP-2110",
    "pt": "pipes",
    "name": "HDPE water pipe 2″, 6 m",
    "cat": "Pipes",
    "img": "/img/pipes-hdpe.jpg",
    "pos": "50% 50%",
    "price": 2400,
    "was": 0,
    "carton": 10,
    "pack": "bundle",
    "slabs": [
      1950,
      1880,
      1800
    ],
    "fins": [
      "c_black"
    ],
    "sub": "63 mm · PN10",
    "wty": "Pressure-tested pipe",
    "tags": "plastic hdpe",
    "specs": [
      "PN10 pressure rating",
      "Bends without fittings",
      "For bores and street mains"
    ]
  },
  {
    "id": "AP-2200",
    "pt": "pipes",
    "name": "Corrugated drain pipe 6″, 6 m",
    "cat": "Pipes",
    "img": "/img/pipes-red.jpg",
    "pos": "50% 50%",
    "price": 3600,
    "was": 0,
    "carton": 5,
    "pack": "bundle",
    "slabs": [
      2950,
      2850,
      2750
    ],
    "fins": [
      "c_red"
    ],
    "sub": "160 mm · double wall",
    "wty": "Pressure-tested pipe",
    "tags": "plastic sewer",
    "specs": [
      "Double wall, smooth inside",
      "For sewer and storm water",
      "Push-fit rubber ring joint"
    ]
  },
  {
    "id": "AP-3100",
    "pt": "home",
    "name": "Heavy-duty plastic stool",
    "cat": "Household",
    "img": "/img/stool.jpg",
    "pos": "50% 55%",
    "alt": "/img/stools.jpg",
    "price": 650,
    "was": 750,
    "carton": 12,
    "slabs": [
      500,
      480,
      460
    ],
    "fins": [
      "c_yellow",
      "c_red",
      "c_blue",
      "c_white"
    ],
    "sub": "Holds 120 kg · stackable",
    "wty": "1-year warranty",
    "tags": "plastic peerhi",
    "specs": [
      "Holds 120 kg",
      "Stacks 20 high",
      "Anti-slip feet"
    ]
  },
  {
    "id": "AP-3200",
    "pt": "home",
    "name": "Bathroom bucket 20 L with mug",
    "cat": "Household",
    "img": "/img/bucket.jpg",
    "pos": "50% 50%",
    "price": 550,
    "was": 0,
    "carton": 12,
    "slabs": [
      420,
      400,
      385
    ],
    "fins": [
      "c_green",
      "c_blue",
      "c_red"
    ],
    "sub": "20 litres · steel handle",
    "wty": "1-year warranty",
    "tags": "plastic balti",
    "specs": [
      "20 litres with matching mug",
      "Steel wire handle",
      "Thick wall, does not crack"
    ]
  },
  {
    "id": "AP-3300",
    "pt": "home",
    "name": "Stackable utility crate",
    "cat": "Household",
    "img": "/img/crates.jpg",
    "pos": "30% 50%",
    "price": 1200,
    "was": 0,
    "carton": 10,
    "slabs": [
      930,
      900,
      870
    ],
    "fins": [
      "c_red",
      "c_green",
      "c_blue"
    ],
    "sub": "45 litres · vented",
    "wty": "1-year warranty",
    "tags": "plastic storage",
    "specs": [
      "45 litres, vented sides",
      "Stacks when full",
      "For shops, stores and kitchens"
    ]
  }
];

export const BY: Record<string, Product> = Object.fromEntries(CATALOG.map((p) => [p.id, p]));

/** Homepage best-seller rail. */
export const BEST = ["AB-1204", "AB-5102", "AB-3310", "AB-6120"].map((id) => BY[id]);

/** Plastic range tabs on the homepage. */
export const PT: Record<"all" | "tanks" | "pipes" | "home", string[]> = {
  "all": [
    "AP-T500",
    "AP-T1000",
    "AP-2040",
    "AP-2020",
    "AP-2110",
    "AP-3100",
    "AP-3200",
    "AP-3300"
  ],
  "tanks": [
    "AP-T300",
    "AP-T500",
    "AP-T1000",
    "AP-T1500"
  ],
  "pipes": [
    "AP-2040",
    "AP-2020",
    "AP-2110",
    "AP-2200"
  ],
  "home": [
    "AP-3100",
    "AP-3200",
    "AP-3300"
  ]
};

/** Tank size finder: people in the house to gallons. */
export const TANKS = [
  {
    "p": "2–3",
    "g": 300,
    "id": "AP-T300"
  },
  {
    "p": "4–6",
    "g": 500,
    "id": "AP-T500"
  },
  {
    "p": "7–10",
    "g": 1000,
    "id": "AP-T1000"
  },
  {
    "p": "11+",
    "g": 1500,
    "id": "AP-T1500"
  }
];

export const LOOKS: Look[] = [
  {
    "name": "Green, stone and brushed gold",
    "mood": "Painted green vanity, brushed gold fittings and a floor-standing filler.",
    "img": "/img/look.jpg",
    "pos": "50% 50%",
    "items": [
      [
        "AB-1410",
        26,
        45,
        "gold"
      ],
      [
        "AB-1206",
        49.5,
        46,
        "gold"
      ],
      [
        "AB-8800",
        84,
        52,
        "gold"
      ]
    ]
  },
  {
    "name": "Twin oak vanities",
    "mood": "Two oak vanities, marble tops and brushed brass mixers.",
    "img": "/img/look-walnut.jpg",
    "pos": "50% 60%",
    "items": [
      [
        "AB-1410",
        28.5,
        66,
        "gold"
      ],
      [
        "AB-2220",
        70,
        77
      ],
      [
        "AB-2300",
        23,
        89
      ]
    ]
  },
  {
    "name": "Stone and matt black",
    "mood": "Warm stone walls, an oak floating vanity and matt black fittings.",
    "img": "/img/look-black.jpg",
    "pos": "50% 56%",
    "items": [
      [
        "AB-1206",
        74.5,
        51,
        "black"
      ],
      [
        "AB-9001",
        42,
        65
      ],
      [
        "AB-2310",
        68,
        72
      ],
      [
        "AB-6510",
        36,
        38.5
      ]
    ]
  },
  {
    "name": "The copper bath",
    "mood": "Zellige tiles, a deep bath and an aged brass filler.",
    "img": "/img/look-copper.jpg",
    "pos": "50% 40%",
    "items": [
      [
        "AB-8800",
        35,
        40,
        "gold"
      ],
      [
        "AB-6120",
        29,
        30,
        "gold"
      ],
      [
        "AB-9120",
        66,
        66
      ]
    ]
  },
  {
    "name": "Bright kitchen corner",
    "mood": "Stainless sink, quartz top and a matt black gooseneck mixer.",
    "img": "/img/look-kitchen.jpg",
    "pos": "50% 38%",
    "items": [
      [
        "AB-4402",
        72,
        27,
        "black"
      ],
      [
        "AB-4500",
        46,
        55
      ]
    ]
  },
  {
    "name": "Rooftop water supply",
    "mood": "Green tanks on a steel stand, filled from the street main.",
    "img": "/img/plastic-tanks.jpg",
    "pos": "50% 55%",
    "items": [
      [
        "AP-T500",
        24,
        40,
        "c_green"
      ],
      [
        "AP-T1000",
        54,
        59,
        "c_green"
      ],
      [
        "AP-2110",
        72,
        85,
        "c_black"
      ]
    ]
  }
];

/** Bathroom set builder defaults. */
export const SET: { id: string; name: string; img: string; on: boolean; qty?: number }[] = [
  {
    "id": "AB-1204",
    "name": "Basin mixer",
    "img": "/img/p-tap.jpg",
    "on": true
  },
  {
    "id": "AB-5102",
    "name": "Rain shower 10″ + arm",
    "img": "/img/rain.jpg",
    "on": true
  },
  {
    "id": "AB-3310",
    "name": "Muslim shower set",
    "img": "/img/hand-gold.jpg",
    "on": true
  },
  {
    "id": "AB-7720",
    "name": "Angle valves ½″",
    "img": "/img/valves.jpg",
    "on": true,
    "qty": 2
  }
];

/** Dealers by city: [shop, area, phone]. */
export const CITIES: Record<string, { n: number; list: [string, string, string][] }> = {
  "Gujranwala": {
    "n": 48,
    "list": [
      [
        "Aabshar Factory Outlet",
        "GT Road, near Chanda Qila",
        "055 3891 420"
      ],
      [
        "Hafiz Sanitary House",
        "Sheikhupura Road",
        "0301 6423 718"
      ],
      [
        "New Punjab Plastics",
        "Gondlanwala Road",
        "0322 7154 093"
      ]
    ]
  },
  "Lahore": {
    "n": 86,
    "list": [
      [
        "Al-Rehman Sanitary Store",
        "Shah Alam Market",
        "0333 4219 805"
      ],
      [
        "Bath & Beyond Gallery",
        "Ferozepur Road",
        "0300 8476 231"
      ],
      [
        "Mian Traders",
        "Badami Bagh",
        "0345 6038 742"
      ]
    ]
  },
  "Karachi": {
    "n": 64,
    "list": [
      [
        "Saddar Plumbing Centre",
        "Plumbing Market, Saddar",
        "0321 2874 560"
      ],
      [
        "Gulshan Sanitary Mart",
        "Gulshan-e-Iqbal, Block 13",
        "0312 9036 415"
      ]
    ]
  },
  "Islamabad": {
    "n": 31,
    "list": [
      [
        "Capital Bath Studio",
        "I-8 Markaz",
        "0334 5512 908"
      ],
      [
        "Margalla Sanitary",
        "G-11 Markaz",
        "0300 5197 364"
      ]
    ]
  },
  "Rawalpindi": {
    "n": 27,
    "list": [
      [
        "Raja Bazaar Sanitary",
        "Raja Bazaar",
        "0315 5280 147"
      ]
    ]
  },
  "Faisalabad": {
    "n": 39,
    "list": [
      [
        "Clock Tower Traders",
        "Kotwali Road",
        "0300 6683 912"
      ],
      [
        "Lyallpur Sanitary",
        "Susan Road",
        "0346 7721 058"
      ]
    ]
  },
  "Multan": {
    "n": 22,
    "list": [
      [
        "Hussain Agahi Sanitary",
        "Hussain Agahi",
        "0306 7340 285"
      ]
    ]
  },
  "Peshawar": {
    "n": 18,
    "list": [
      [
        "Khyber Sanitary House",
        "University Road",
        "0331 9074 613"
      ]
    ]
  },
  "Sialkot": {
    "n": 16,
    "list": [
      [
        "Sialkot Bath Centre",
        "Paris Road",
        "0324 6158 790"
      ]
    ]
  }
};

/** Delivery days and fee by city. */
export const SHIP: Record<string, { d: number; f: number }> = {
  "Gujranwala": {
    "d": 1,
    "f": 150
  },
  "Lahore": {
    "d": 2,
    "f": 250
  },
  "Sialkot": {
    "d": 1,
    "f": 200
  },
  "Islamabad": {
    "d": 2,
    "f": 350
  },
  "Rawalpindi": {
    "d": 2,
    "f": 350
  },
  "Faisalabad": {
    "d": 2,
    "f": 300
  },
  "Multan": {
    "d": 3,
    "f": 400
  },
  "Peshawar": {
    "d": 3,
    "f": 450
  },
  "Karachi": {
    "d": 4,
    "f": 550
  },
  "Quetta": {
    "d": 5,
    "f": 700
  }
};

/** Gujranwala and Lahore get free delivery over this subtotal. */
export const FREE_OVER = 15000;

export type PayId = "cod" | "jazz" | "easy" | "bank" | "credit";
/** [id, label, description] */
export const PAYS: [PayId, string, string][] = [
  [
    "cod",
    "Cash on Delivery",
    "Pay the rider in cash when it arrives."
  ],
  [
    "jazz",
    "JazzCash",
    "Pay from your JazzCash wallet. You get a payment request on your phone."
  ],
  [
    "easy",
    "Easypaisa",
    "Pay from your Easypaisa account. You get a payment request on your phone."
  ],
  [
    "bank",
    "Bank transfer",
    "Transfer to our Meezan Bank account. We send the details on WhatsApp."
  ],
  [
    "credit",
    "On credit (khata)",
    "Added to your dealer khata. Pay by the due date."
  ]
];

export const DEALER = {
  "name": "Hafiz Sanitary House",
  "init": "HS",
  "city": "Gujranwala",
  "tier": "B",
  "since": 2019,
  "limit": 5000000,
  "used": 3240500,
  "due": "2026-12-14",
  "manager": "Bilal (area manager)"
};

/** [date, reference, detail, debit, credit], newest first. */
export const LEDGER: [string, string, string, number, number][] = [
  [
    "2026-11-21",
    "ORD-10432",
    "Order on credit",
    612400,
    0
  ],
  [
    "2026-11-18",
    "PAY-2291",
    "Bank transfer, Meezan",
    0,
    750000
  ],
  [
    "2026-11-12",
    "ORD-10397",
    "Order on credit",
    1184000,
    0
  ],
  [
    "2026-11-04",
    "CLM-0087",
    "Warranty claim credit",
    0,
    18600
  ],
  [
    "2026-10-29",
    "ORD-10351",
    "Order on credit",
    948300,
    0
  ],
  [
    "2026-10-20",
    "PAY-2240",
    "JazzCash business",
    0,
    500000
  ]
];

/** st is the index into STAGES. */
export const ORDERS: { no: string; date: string; items: number; cartons: number; total: number; st: number }[] = [
  {
    "no": "ORD-10432",
    "date": "2026-11-21",
    "items": 6,
    "cartons": 38,
    "total": 612400,
    "st": 2
  },
  {
    "no": "ORD-10397",
    "date": "2026-11-12",
    "items": 9,
    "cartons": 64,
    "total": 1184000,
    "st": 3
  },
  {
    "no": "ORD-10351",
    "date": "2026-10-29",
    "items": 7,
    "cartons": 51,
    "total": 948300,
    "st": 3
  }
];

/** Dealer's last order: [productId, cartons]. */
export const LAST: [string, number][] = [
  [
    "AB-7720",
    6
  ],
  [
    "AB-3310",
    4
  ],
  [
    "AP-2020",
    3
  ],
  [
    "AB-1204",
    2
  ],
  [
    "AP-T500",
    5
  ]
];

export const STAGES = [
  "Confirmed",
  "Packed",
  "On the way",
  "Delivered"
] as const;
