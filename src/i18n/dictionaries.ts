export const dictionaries = {
  en: {
    "app.name": "TexMoto",
    "nav.home": "Home",
    "nav.motorcycles": "Motorcycles",
    "nav.add": "Add",
    "nav.settings": "Settings",
    "motorcycle.add": "Add motorcycle",
    "motorcycle.publish": "Publish",
    "motorcycle.saveDraft": "Save draft",
    "motorcycle.price": "Price",
    "motorcycle.moreDetails": "More details",
    "motorcycle.status.available": "Available",
    "motorcycle.status.draft": "Draft",
    "motorcycle.status.reserved": "Reserved",
    "motorcycle.status.sold": "Sold",
    "motorcycle.status.hidden": "Hidden",
  },
  km: {
    "app.name": "តិចម៉ូតូ",
    "nav.home": "ទំព័រដើម",
    "nav.motorcycles": "ម៉ូតូ",
    "nav.add": "បន្ថែម",
    "nav.settings": "ការកំណត់",
    "motorcycle.add": "បន្ថែមម៉ូតូ",
    "motorcycle.publish": "ផ្សព្វផ្សាយ",
    "motorcycle.saveDraft": "រក្សាទុកព្រាង",
    "motorcycle.price": "តម្លៃ",
    "motorcycle.moreDetails": "ព័ត៌មានបន្ថែម",
    "motorcycle.status.available": "មានលក់",
    "motorcycle.status.draft": "ព្រាង",
    "motorcycle.status.reserved": "បានកក់",
    "motorcycle.status.sold": "បានលក់",
    "motorcycle.status.hidden": "លាក់",
  },
} as const;

export type Locale = keyof typeof dictionaries;
export type TranslationKey = keyof (typeof dictionaries)["en"];

export function getDictionary(locale: Locale = "en") {
  return dictionaries[locale];
}

