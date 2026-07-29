// apps/web/src/lib/constants/organization-options.ts

// IMPORTANT:
// apps/api/src/organizations/constants/organization-options.ts と
// 同じ内容を維持すること。
// 将来 packages/shared を正式導入するときに共通化する。

export const INDUSTRY_OPTIONS = [
  { value: 'GENERAL_CONSTRUCTION', label: '総合建設・元請' },
  { value: 'CIVIL_ENGINEERING', label: '土木工事' },
  { value: 'CARPENTRY', label: '大工・木工' },
  { value: 'ELECTRICAL', label: '電気工事' },
  { value: 'PLUMBING_AND_EQUIPMENT', label: '配管・設備工事' },
  {
    value: 'PAINTING_AND_WATERPROOFING',
    label: '塗装・防水工事',
  },
  { value: 'INTERIOR_AND_FINISHING', label: '内装・仕上工事' },
  { value: 'ROOFING_AND_EXTERIOR', label: '屋根・外装工事' },
  { value: 'STEEL_AND_METAL', label: '鉄骨・金属工事' },
  { value: 'LANDSCAPING', label: '造園工事' },
  { value: 'DEMOLITION', label: '解体工事' },
  { value: 'BUILDING_CLEANING', label: '美装・建物清掃' },
  {
    value: 'OTHER_CONSTRUCTION_RELATED',
    label: 'その他の建設関連業',
  },
] as const;

export const INDUSTRY_VALUES = INDUSTRY_OPTIONS.map(
  (option) => option.value,
);

export const PREFECTURE_OPTIONS = [
  { value: 'HOKKAIDO', label: '北海道' },
  { value: 'AOMORI', label: '青森県' },
  { value: 'IWATE', label: '岩手県' },
  { value: 'MIYAGI', label: '宮城県' },
  { value: 'AKITA', label: '秋田県' },
  { value: 'YAMAGATA', label: '山形県' },
  { value: 'FUKUSHIMA', label: '福島県' },
  { value: 'IBARAKI', label: '茨城県' },
  { value: 'TOCHIGI', label: '栃木県' },
  { value: 'GUNMA', label: '群馬県' },
  { value: 'SAITAMA', label: '埼玉県' },
  { value: 'CHIBA', label: '千葉県' },
  { value: 'TOKYO', label: '東京都' },
  { value: 'KANAGAWA', label: '神奈川県' },
  { value: 'NIIGATA', label: '新潟県' },
  { value: 'TOYAMA', label: '富山県' },
  { value: 'ISHIKAWA', label: '石川県' },
  { value: 'FUKUI', label: '福井県' },
  { value: 'YAMANASHI', label: '山梨県' },
  { value: 'NAGANO', label: '長野県' },
  { value: 'GIFU', label: '岐阜県' },
  { value: 'SHIZUOKA', label: '静岡県' },
  { value: 'AICHI', label: '愛知県' },
  { value: 'MIE', label: '三重県' },
  { value: 'SHIGA', label: '滋賀県' },
  { value: 'KYOTO', label: '京都府' },
  { value: 'OSAKA', label: '大阪府' },
  { value: 'HYOGO', label: '兵庫県' },
  { value: 'NARA', label: '奈良県' },
  { value: 'WAKAYAMA', label: '和歌山県' },
  { value: 'TOTTORI', label: '鳥取県' },
  { value: 'SHIMANE', label: '島根県' },
  { value: 'OKAYAMA', label: '岡山県' },
  { value: 'HIROSHIMA', label: '広島県' },
  { value: 'YAMAGUCHI', label: '山口県' },
  { value: 'TOKUSHIMA', label: '徳島県' },
  { value: 'KAGAWA', label: '香川県' },
  { value: 'EHIME', label: '愛媛県' },
  { value: 'KOCHI', label: '高知県' },
  { value: 'FUKUOKA', label: '福岡県' },
  { value: 'SAGA', label: '佐賀県' },
  { value: 'NAGASAKI', label: '長崎県' },
  { value: 'KUMAMOTO', label: '熊本県' },
  { value: 'OITA', label: '大分県' },
  { value: 'MIYAZAKI', label: '宮崎県' },
  { value: 'KAGOSHIMA', label: '鹿児島県' },
  { value: 'OKINAWA', label: '沖縄県' },
] as const;

export const PREFECTURE_VALUES = PREFECTURE_OPTIONS.map(
  (option) => option.value,
);

export const EMPLOYEE_RANGE_OPTIONS = [
  { value: 'SOLO', label: '1人' },
  { value: 'TWO_TO_FIVE', label: '2〜5人' },
  { value: 'SIX_TO_TEN', label: '6〜10人' },
  { value: 'ELEVEN_TO_THIRTY', label: '11〜30人' },
  { value: 'THIRTY_ONE_TO_FIFTY', label: '31〜50人' },
  { value: 'FIFTY_ONE_OR_MORE', label: '51人以上' },
] as const;

export const EMPLOYEE_RANGE_VALUES = EMPLOYEE_RANGE_OPTIONS.map(
  (option) => option.value,
);
