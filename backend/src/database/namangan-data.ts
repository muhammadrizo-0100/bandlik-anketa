export interface DistrictSeedData {
  name: string;
  code: string;
}

export const NAMANGAN_DISTRICTS: DistrictSeedData[] = [
  { name: 'Namangan shahri', code: 'NSH' },
  { name: 'Davlatobod tumani', code: 'DAV' },
  { name: 'Yangi Namangan tumani', code: 'YN2' },
  { name: 'Chortoq tumani', code: 'CHO' },
  { name: 'Chust tumani', code: 'CHU' },
  { name: 'Kosonsoy tumani', code: 'KOS' },
  { name: 'Mingbuloq tumani', code: 'MIN' },
  { name: 'Namangan tumani', code: 'NAM' },
  { name: 'Norin tumani', code: 'NOR' },
  { name: 'Pop tumani', code: 'POP' },
  { name: 'To\'raqo\'rg\'on tumani', code: 'TOR' },
  { name: 'Uychi tumani', code: 'UYI' },
  { name: 'Uchqo\'rg\'on tumani', code: 'UCH' },
  { name: 'Yangiqo\'rg\'on tumani', code: 'YAQ' },
];

export const NAMANGAN_MAHALLAS: Record<string, string[]> = {
  'Namangan shahri': [
    'Goʻzal', 'Bobur', 'Chorsu', 'Lolazor', 'Shodlik', 'Guliston', 'Gʻalaba', 'Istiqlol',
    'Yangi hayot', 'Nodirabegim', 'Navroʻz', 'Zarafshon', 'Toʻqimachi', 'Qoradaryo',
    'Mehnatobod', 'Yuksalish', 'Bunyodkor', 'Doʻstlik', 'Mustaqillik', 'Navbahor', 'Orzu', 'Mashrab'
  ],
  'Davlatobod tumani': [
    'Guliston', 'Yuksalish', 'Barkamol', 'Yangi tong', 'Navbahor', 'Orzu', 'Elxona',
    'Damariq', 'Porloq', 'Quyi Gʻirvon', 'Yuqori Gʻirvon', 'Madaniy yer', 'Porloq tong',
    'Shifokor', 'Yoshlik'
  ],
  'Yangi Namangan tumani': [
    'Sihatgoh', 'Orzu', 'Mingchinor', 'Goʻzal', 'Ishonch', 'Shomahalla', 'Qahramon',
    'Gulshan', 'Maʼrifat', 'Oydin', 'Mustaqillik', 'Sherbuloq'
  ],
  'Chortoq tumani': [
    'Alisher Navoiy', 'Bogʻiston', 'Chortoq', 'Guliston', 'Hazrati Shoh', 'Mustaqillik',
    'Namuna', 'Oromgoh', 'Pastki Bogʻ', 'Tinchlik', 'Yuqori Chortoq', 'Sohil', 'Beshkapa'
  ],
  'Chust tumani': [
    'Chust', 'Bibiona', 'Bogʻishamol', 'Varzik', 'Gʻova', 'Doʻstlik', 'Kamarsada',
    'Karkidon', 'Olmos', 'Qoʻgʻay', 'Sadacha', 'Chustiy', 'Baymoq', 'Yorqishloq'
  ],
  'Kosonsoy tumani': [
    'Koson', 'Bogʻbon', 'Gulbogʻ', 'Kasan', 'Ozod', 'Soyboʻyi', 'Tergachi',
    'Chindovul', 'Yangiyoʻl', 'Qoraqoʻrgʻon', 'Qorasuv', 'Oʻzbekiston'
  ],
  'Mingbuloq tumani': [
    'Jumabozor', 'Doʻstlik', 'Goʻzal', 'Qiziltepa', 'Mehnatobod', 'Momoxon',
    'Yangihayot', 'Oltinkoʻl', 'Gulbogʻ', 'Qoʻgʻayguzar'
  ],
  'Namangan tumani': [
    'Toshbuloq', 'Mirishkor', 'Qumqoʻrgʻon', 'Xonobod', 'Shurqoʻrgʻon', 'Bogʻishamol',
    'Shoʻrbuloq', 'Yangiqishloq', 'Irvadan', 'Tepaqoʻrgʻon'
  ],
  'Norin tumani': [
    'Haqqulobod', 'Shoʻrariq', 'Boʻston', 'Qoraxitoy', 'Toʻlqin', 'Norinkapa',
    'Uchtepa', 'Qoratepa', 'Oʻzbekiston', 'Pastki Choʻja'
  ],
  'Pop tumani': [
    'Pop', 'Chorkesar', 'Uygʻursoy', 'Chustobod', 'Sang', 'Qandgʻon',
    'Oltinkon', 'Xalqobod', 'Vodiy', 'Gʻurrum', 'Navbahor'
  ],
  'To\'raqo\'rg\'on tumani': [
    'Toʻraqoʻrgʻon', 'Islohot', 'Shahand', 'Mozorkoʻhna', 'Oqtosh', 'Yandama',
    'Buramatut', 'Saroy', 'Kumidon', 'Sayram', 'Qatagʻon'
  ],
  'Uychi tumani': [
    'Uychi', 'Jiydakapa', 'Churtuk', 'Fayziobod', 'Qumtepa', 'Birlik',
    'Mashad', 'Boygʻon', 'Ziyokor', 'Kizilravot'
  ],
  'Uchqo\'rg\'on tumani': [
    'Uchqoʻrgʻon', 'Qoʻgʻay', 'Yangiobod', 'Mashrab', 'Yoshlik', 'Qayqi',
    'Paxtachi', 'Madaniyat', 'Doʻstlik', 'Dehqonobod'
  ],
  'Yangiqo\'rg\'on tumani': [
    'Yangiqoʻrg\'on', 'Bekobod', 'Nanay', 'Poramon', 'Zarkent', 'Qizil yoz',
    'Birlashgan', 'Navroʻz', 'Gʻovazon', 'Rovot'
  ]
};
