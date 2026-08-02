/**
 * Corporate UI copy only — not a product-wide i18n system.
 * Content fields use BilingualText; these strings are block chrome labels.
 */
export type CorpLang = 'vi' | 'en';

export const CORPORATE_STRINGS: Record<
  CorpLang,
  {
    langToggleVi: string;
    langToggleEn: string;
    mealStandard: string;
    mealVegetarian: string;
    mealLabel: string;
    allergyLabel: string;
    allergyPlaceholder: string;
    plusOnesLabel: string;
    savePassCard: string;
    passCodeLabel: string;
    tableLabel: string;
    noTableYet: string;
    brandColorWarn: string;
    untranslatedHint: string;
  }
> = {
  vi: {
    langToggleVi: 'VI',
    langToggleEn: 'EN',
    mealStandard: 'Suất thường',
    mealVegetarian: 'Suất chay',
    mealLabel: 'Suất ăn',
    allergyLabel: 'Dị ứng / hạn chế ăn',
    allergyPlaceholder: 'Ví dụ: hải sản, đậu phộng',
    plusOnesLabel: 'Số người đi kèm',
    savePassCard: 'Lưu thẻ vào ảnh',
    passCodeLabel: 'Mã vào cổng',
    tableLabel: 'Bàn',
    noTableYet: 'Chưa xếp bàn',
    brandColorWarn:
      'Màu này hơi nhạt — hệ thống đã chỉnh để chữ vẫn đọc được.',
    untranslatedHint: 'mục chưa có bản English',
  },
  en: {
    langToggleVi: 'VI',
    langToggleEn: 'EN',
    mealStandard: 'Standard meal',
    mealVegetarian: 'Vegetarian',
    mealLabel: 'Meal choice',
    allergyLabel: 'Allergies / dietary notes',
    allergyPlaceholder: 'e.g. seafood, peanuts',
    plusOnesLabel: 'Guests accompanying you',
    savePassCard: 'Save pass as image',
    passCodeLabel: 'Entry code',
    tableLabel: 'Table',
    noTableYet: 'Table not assigned yet',
    brandColorWarn:
      'This colour is light — we adjusted it so text stays readable.',
    untranslatedHint: 'items without English yet',
  },
};

export function corpStr(lang: CorpLang, key: keyof (typeof CORPORATE_STRINGS)['vi']) {
  return CORPORATE_STRINGS[lang][key];
}
