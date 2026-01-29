/**
 * Algeria Wilaya Data with Yalidine Shipping Prices
 * Complete list of all 58 Algerian wilayas with delivery pricing
 */

export type DeliveryType = 'HOME' | 'CENTER';

export interface Wilaya {
  id: number;
  code: string; // 2-digit code (01-58)
  name: string;
  nameAr: string;
  nameFr: string;
  /** Yalidine shipping price for HOME delivery in DA (centimes) */
  homeDeliveryPrice: number;
  /** Yalidine shipping price for CENTER/STOP-DESK delivery in DA (centimes) */
  centerDeliveryPrice: number;
  /** Estimated delivery days for HOME */
  homeDeliveryDays: number;
  /** Estimated delivery days for CENTER */
  centerDeliveryDays: number;
  /** Is this a major city with faster delivery */
  isMajorCity: boolean;
}

/**
 * All 58 Algerian Wilayas with Yalidine shipping prices
 * Prices are in DA (Algerian Dinars)
 * Based on typical Yalidine zones:
 * - Zone 1 (Major cities): Alger, Oran, Constantine, Annaba, Blida
 * - Zone 2 (Secondary): Setif, Batna, Djelfa, Sidi Bel Abbes, etc.
 * - Zone 3 (Remote): Saharan wilayas, southern regions
 */
export const WILAYAS: Wilaya[] = [
  // Zone 1 - Major Cities (Lowest prices, fastest delivery)
  { id: 16, code: '16', name: 'Alger', nameAr: 'الجزائر', nameFr: 'Alger', homeDeliveryPrice: 500, centerDeliveryPrice: 350, homeDeliveryDays: 1, centerDeliveryDays: 1, isMajorCity: true },
  { id: 31, code: '31', name: 'Oran', nameAr: 'وهران', nameFr: 'Oran', homeDeliveryPrice: 550, centerDeliveryPrice: 400, homeDeliveryDays: 2, centerDeliveryDays: 1, isMajorCity: true },
  { id: 25, code: '25', name: 'Constantine', nameAr: 'قسنطينة', nameFr: 'Constantine', homeDeliveryPrice: 550, centerDeliveryPrice: 400, homeDeliveryDays: 2, centerDeliveryDays: 1, isMajorCity: true },
  { id: 23, code: '23', name: 'Annaba', nameAr: 'عنابة', nameFr: 'Annaba', homeDeliveryPrice: 600, centerDeliveryPrice: 450, homeDeliveryDays: 2, centerDeliveryDays: 2, isMajorCity: true },
  { id: 9, code: '09', name: 'Blida', nameAr: 'البليدة', nameFr: 'Blida', homeDeliveryPrice: 500, centerDeliveryPrice: 350, homeDeliveryDays: 1, centerDeliveryDays: 1, isMajorCity: true },
  
  // Zone 2 - Secondary Cities
  { id: 19, code: '19', name: 'Sétif', nameAr: 'سطيف', nameFr: 'Sétif', homeDeliveryPrice: 600, centerDeliveryPrice: 450, homeDeliveryDays: 2, centerDeliveryDays: 2, isMajorCity: false },
  { id: 5, code: '05', name: 'Batna', nameAr: 'باتنة', nameFr: 'Batna', homeDeliveryPrice: 650, centerDeliveryPrice: 500, homeDeliveryDays: 3, centerDeliveryDays: 2, isMajorCity: false },
  { id: 17, code: '17', name: 'Djelfa', nameAr: 'الجلفة', nameFr: 'Djelfa', homeDeliveryPrice: 700, centerDeliveryPrice: 550, homeDeliveryDays: 3, centerDeliveryDays: 3, isMajorCity: false },
  { id: 22, code: '22', name: 'Sidi Bel Abbès', nameAr: 'سيدي بلعباس', nameFr: 'Sidi Bel Abbès', homeDeliveryPrice: 650, centerDeliveryPrice: 500, homeDeliveryDays: 3, centerDeliveryDays: 2, isMajorCity: false },
  { id: 6, code: '06', name: 'Béjaïa', nameAr: 'بجاية', nameFr: 'Béjaïa', homeDeliveryPrice: 600, centerDeliveryPrice: 450, homeDeliveryDays: 2, centerDeliveryDays: 2, isMajorCity: false },
  { id: 15, code: '15', name: 'Tizi Ouzou', nameAr: 'تيزي وزو', nameFr: 'Tizi Ouzou', homeDeliveryPrice: 550, centerDeliveryPrice: 400, homeDeliveryDays: 2, centerDeliveryDays: 2, isMajorCity: false },
  { id: 35, code: '35', name: 'Boumerdès', nameAr: 'بومرداس', nameFr: 'Boumerdès', homeDeliveryPrice: 500, centerDeliveryPrice: 350, homeDeliveryDays: 1, centerDeliveryDays: 1, isMajorCity: false },
  { id: 42, code: '42', name: 'Tipaza', nameAr: 'تيبازة', nameFr: 'Tipaza', homeDeliveryPrice: 500, centerDeliveryPrice: 350, homeDeliveryDays: 1, centerDeliveryDays: 1, isMajorCity: false },
  
  // Zone 2 - Continued
  { id: 1, code: '01', name: 'Adrar', nameAr: 'أدرار', nameFr: 'Adrar', homeDeliveryPrice: 1200, centerDeliveryPrice: 1000, homeDeliveryDays: 7, centerDeliveryDays: 5, isMajorCity: false },
  { id: 2, code: '02', name: 'Chlef', nameAr: 'الشلف', nameFr: 'Chlef', homeDeliveryPrice: 600, centerDeliveryPrice: 450, homeDeliveryDays: 2, centerDeliveryDays: 2, isMajorCity: false },
  { id: 3, code: '03', name: 'Laghouat', nameAr: 'الأغواط', nameFr: 'Laghouat', homeDeliveryPrice: 800, centerDeliveryPrice: 650, homeDeliveryDays: 4, centerDeliveryDays: 3, isMajorCity: false },
  { id: 4, code: '04', name: 'Oum El Bouaghi', nameAr: 'أم البواقي', nameFr: 'Oum El Bouaghi', homeDeliveryPrice: 650, centerDeliveryPrice: 500, homeDeliveryDays: 3, centerDeliveryDays: 2, isMajorCity: false },
  { id: 7, code: '07', name: 'Biskra', nameAr: 'بسكرة', nameFr: 'Biskra', homeDeliveryPrice: 750, centerDeliveryPrice: 600, homeDeliveryDays: 3, centerDeliveryDays: 3, isMajorCity: false },
  { id: 8, code: '08', name: 'Béchar', nameAr: 'بشار', nameFr: 'Béchar', homeDeliveryPrice: 1100, centerDeliveryPrice: 900, homeDeliveryDays: 6, centerDeliveryDays: 5, isMajorCity: false },
  { id: 10, code: '10', name: 'Bouira', nameAr: 'البويرة', nameFr: 'Bouira', homeDeliveryPrice: 550, centerDeliveryPrice: 400, homeDeliveryDays: 2, centerDeliveryDays: 2, isMajorCity: false },
  { id: 11, code: '11', name: 'Tamanrasset', nameAr: 'تمنراست', nameFr: 'Tamanrasset', homeDeliveryPrice: 1500, centerDeliveryPrice: 1200, homeDeliveryDays: 10, centerDeliveryDays: 7, isMajorCity: false },
  { id: 12, code: '12', name: 'Tébessa', nameAr: 'تبسة', nameFr: 'Tébessa', homeDeliveryPrice: 700, centerDeliveryPrice: 550, homeDeliveryDays: 3, centerDeliveryDays: 3, isMajorCity: false },
  { id: 13, code: '13', name: 'Tlemcen', nameAr: 'تلمسان', nameFr: 'Tlemcen', homeDeliveryPrice: 650, centerDeliveryPrice: 500, homeDeliveryDays: 3, centerDeliveryDays: 2, isMajorCity: false },
  { id: 14, code: '14', name: 'Tiaret', nameAr: 'تيارت', nameFr: 'Tiaret', homeDeliveryPrice: 700, centerDeliveryPrice: 550, homeDeliveryDays: 3, centerDeliveryDays: 2, isMajorCity: false },
  { id: 18, code: '18', name: 'Jijel', nameAr: 'جيجل', nameFr: 'Jijel', homeDeliveryPrice: 650, centerDeliveryPrice: 500, homeDeliveryDays: 3, centerDeliveryDays: 2, isMajorCity: false },
  { id: 20, code: '20', name: 'Saïda', nameAr: 'سعيدة', nameFr: 'Saïda', homeDeliveryPrice: 700, centerDeliveryPrice: 550, homeDeliveryDays: 3, centerDeliveryDays: 3, isMajorCity: false },
  { id: 21, code: '21', name: 'Skikda', nameAr: 'سكيكدة', nameFr: 'Skikda', homeDeliveryPrice: 650, centerDeliveryPrice: 500, homeDeliveryDays: 3, centerDeliveryDays: 2, isMajorCity: false },
  { id: 24, code: '24', name: 'Guelma', nameAr: 'قالمة', nameFr: 'Guelma', homeDeliveryPrice: 650, centerDeliveryPrice: 500, homeDeliveryDays: 3, centerDeliveryDays: 2, isMajorCity: false },
  { id: 26, code: '26', name: 'Médéa', nameAr: 'المدية', nameFr: 'Médéa', homeDeliveryPrice: 600, centerDeliveryPrice: 450, homeDeliveryDays: 2, centerDeliveryDays: 2, isMajorCity: false },
  { id: 27, code: '27', name: 'Mostaganem', nameAr: 'مستغانم', nameFr: 'Mostaganem', homeDeliveryPrice: 600, centerDeliveryPrice: 450, homeDeliveryDays: 2, centerDeliveryDays: 2, isMajorCity: false },
  { id: 28, code: '28', name: "M'Sila", nameAr: 'المسيلة', nameFr: "M'Sila", homeDeliveryPrice: 700, centerDeliveryPrice: 550, homeDeliveryDays: 3, centerDeliveryDays: 3, isMajorCity: false },
  { id: 29, code: '29', name: 'Mascara', nameAr: 'معسكر', nameFr: 'Mascara', homeDeliveryPrice: 650, centerDeliveryPrice: 500, homeDeliveryDays: 3, centerDeliveryDays: 2, isMajorCity: false },
  { id: 30, code: '30', name: 'Ouargla', nameAr: 'ورقلة', nameFr: 'Ouargla', homeDeliveryPrice: 900, centerDeliveryPrice: 750, homeDeliveryDays: 5, centerDeliveryDays: 4, isMajorCity: false },
  { id: 32, code: '32', name: 'El Bayadh', nameAr: 'البيض', nameFr: 'El Bayadh', homeDeliveryPrice: 900, centerDeliveryPrice: 750, homeDeliveryDays: 5, centerDeliveryDays: 4, isMajorCity: false },
  { id: 33, code: '33', name: 'Illizi', nameAr: 'إليزي', nameFr: 'Illizi', homeDeliveryPrice: 1500, centerDeliveryPrice: 1200, homeDeliveryDays: 10, centerDeliveryDays: 7, isMajorCity: false },
  { id: 34, code: '34', name: 'Bordj Bou Arréridj', nameAr: 'برج بوعريريج', nameFr: 'Bordj Bou Arréridj', homeDeliveryPrice: 650, centerDeliveryPrice: 500, homeDeliveryDays: 3, centerDeliveryDays: 2, isMajorCity: false },
  { id: 36, code: '36', name: 'El Tarf', nameAr: 'الطارف', nameFr: 'El Tarf', homeDeliveryPrice: 700, centerDeliveryPrice: 550, homeDeliveryDays: 3, centerDeliveryDays: 2, isMajorCity: false },
  { id: 37, code: '37', name: 'Tindouf', nameAr: 'تندوف', nameFr: 'Tindouf', homeDeliveryPrice: 1500, centerDeliveryPrice: 1200, homeDeliveryDays: 10, centerDeliveryDays: 7, isMajorCity: false },
  { id: 38, code: '38', name: 'Tissemsilt', nameAr: 'تيسمسيلت', nameFr: 'Tissemsilt', homeDeliveryPrice: 700, centerDeliveryPrice: 550, homeDeliveryDays: 3, centerDeliveryDays: 3, isMajorCity: false },
  { id: 39, code: '39', name: 'El Oued', nameAr: 'الوادي', nameFr: 'El Oued', homeDeliveryPrice: 850, centerDeliveryPrice: 700, homeDeliveryDays: 4, centerDeliveryDays: 3, isMajorCity: false },
  { id: 40, code: '40', name: 'Khenchela', nameAr: 'خنشلة', nameFr: 'Khenchela', homeDeliveryPrice: 700, centerDeliveryPrice: 550, homeDeliveryDays: 3, centerDeliveryDays: 3, isMajorCity: false },
  { id: 41, code: '41', name: 'Souk Ahras', nameAr: 'سوق أهراس', nameFr: 'Souk Ahras', homeDeliveryPrice: 700, centerDeliveryPrice: 550, homeDeliveryDays: 3, centerDeliveryDays: 3, isMajorCity: false },
  { id: 43, code: '43', name: 'Mila', nameAr: 'ميلة', nameFr: 'Mila', homeDeliveryPrice: 650, centerDeliveryPrice: 500, homeDeliveryDays: 3, centerDeliveryDays: 2, isMajorCity: false },
  { id: 44, code: '44', name: 'Aïn Defla', nameAr: 'عين الدفلى', nameFr: 'Aïn Defla', homeDeliveryPrice: 600, centerDeliveryPrice: 450, homeDeliveryDays: 2, centerDeliveryDays: 2, isMajorCity: false },
  { id: 45, code: '45', name: 'Naâma', nameAr: 'النعامة', nameFr: 'Naâma', homeDeliveryPrice: 900, centerDeliveryPrice: 750, homeDeliveryDays: 5, centerDeliveryDays: 4, isMajorCity: false },
  { id: 46, code: '46', name: 'Aïn Témouchent', nameAr: 'عين تموشنت', nameFr: 'Aïn Témouchent', homeDeliveryPrice: 650, centerDeliveryPrice: 500, homeDeliveryDays: 3, centerDeliveryDays: 2, isMajorCity: false },
  { id: 47, code: '47', name: 'Ghardaïa', nameAr: 'غرداية', nameFr: 'Ghardaïa', homeDeliveryPrice: 900, centerDeliveryPrice: 750, homeDeliveryDays: 5, centerDeliveryDays: 4, isMajorCity: false },
  { id: 48, code: '48', name: 'Relizane', nameAr: 'غليزان', nameFr: 'Relizane', homeDeliveryPrice: 650, centerDeliveryPrice: 500, homeDeliveryDays: 3, centerDeliveryDays: 2, isMajorCity: false },
  
  // New wilayas (2019 territorial reform - wilayas 49-58)
  { id: 49, code: '49', name: 'El M\'Ghair', nameAr: 'المغير', nameFr: 'El M\'Ghair', homeDeliveryPrice: 900, centerDeliveryPrice: 750, homeDeliveryDays: 5, centerDeliveryDays: 4, isMajorCity: false },
  { id: 50, code: '50', name: 'El Meniaa', nameAr: 'المنيعة', nameFr: 'El Meniaa', homeDeliveryPrice: 1000, centerDeliveryPrice: 850, homeDeliveryDays: 6, centerDeliveryDays: 5, isMajorCity: false },
  { id: 51, code: '51', name: 'Ouled Djellal', nameAr: 'أولاد جلال', nameFr: 'Ouled Djellal', homeDeliveryPrice: 800, centerDeliveryPrice: 650, homeDeliveryDays: 4, centerDeliveryDays: 3, isMajorCity: false },
  { id: 52, code: '52', name: 'Bordj Baji Mokhtar', nameAr: 'برج باجي مختار', nameFr: 'Bordj Baji Mokhtar', homeDeliveryPrice: 1500, centerDeliveryPrice: 1200, homeDeliveryDays: 10, centerDeliveryDays: 7, isMajorCity: false },
  { id: 53, code: '53', name: 'Béni Abbès', nameAr: 'بني عباس', nameFr: 'Béni Abbès', homeDeliveryPrice: 1200, centerDeliveryPrice: 1000, homeDeliveryDays: 7, centerDeliveryDays: 5, isMajorCity: false },
  { id: 54, code: '54', name: 'Timimoun', nameAr: 'تيميمون', nameFr: 'Timimoun', homeDeliveryPrice: 1200, centerDeliveryPrice: 1000, homeDeliveryDays: 7, centerDeliveryDays: 5, isMajorCity: false },
  { id: 55, code: '55', name: 'Touggourt', nameAr: 'تقرت', nameFr: 'Touggourt', homeDeliveryPrice: 850, centerDeliveryPrice: 700, homeDeliveryDays: 4, centerDeliveryDays: 3, isMajorCity: false },
  { id: 56, code: '56', name: 'Djanet', nameAr: 'جانت', nameFr: 'Djanet', homeDeliveryPrice: 1500, centerDeliveryPrice: 1200, homeDeliveryDays: 10, centerDeliveryDays: 7, isMajorCity: false },
  { id: 57, code: '57', name: 'In Salah', nameAr: 'عين صالح', nameFr: 'In Salah', homeDeliveryPrice: 1300, centerDeliveryPrice: 1100, homeDeliveryDays: 8, centerDeliveryDays: 6, isMajorCity: false },
  { id: 58, code: '58', name: 'In Guezzam', nameAr: 'عين قزام', nameFr: 'In Guezzam', homeDeliveryPrice: 1500, centerDeliveryPrice: 1200, homeDeliveryDays: 10, centerDeliveryDays: 7, isMajorCity: false },
];

// Sort wilayas by ID for consistent display
export const WILAYAS_SORTED = [...WILAYAS].sort((a, b) => a.id - b.id);

/**
 * Get wilaya by ID
 */
export function getWilayaById(id: number): Wilaya | undefined {
  return WILAYAS.find(w => w.id === id);
}

/**
 * Get wilaya by code (string)
 */
export function getWilayaByCode(code: string): Wilaya | undefined {
  const numCode = parseInt(code, 10);
  return WILAYAS.find(w => w.id === numCode);
}

/**
 * Get shipping price for a wilaya based on delivery type
 */
export function getShippingPrice(wilayaId: number, deliveryType: DeliveryType): number {
  const wilaya = getWilayaById(wilayaId);
  if (!wilaya) return 0;
  return deliveryType === 'HOME' ? wilaya.homeDeliveryPrice : wilaya.centerDeliveryPrice;
}

/**
 * Get estimated delivery days for a wilaya
 */
export function getDeliveryDays(wilayaId: number, deliveryType: DeliveryType): number {
  const wilaya = getWilayaById(wilayaId);
  if (!wilaya) return 0;
  return deliveryType === 'HOME' ? wilaya.homeDeliveryDays : wilaya.centerDeliveryDays;
}

/**
 * Format price in DA
 */
export function formatPriceDA(price: number): string {
  return `${price.toLocaleString('fr-DZ', { maximumFractionDigits: 0 })} DA`;
}
