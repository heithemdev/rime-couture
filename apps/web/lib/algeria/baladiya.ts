/**
 * Algeria Baladiya (Commune) Data
 * Cities/communes within each wilaya for address selection
 */

export type Baladiya = {
  code: string;
  name: string;
};

/**
 * Baladiyas organized by wilaya ID
 * Key = wilaya ID (1-58)
 */
export const BALADIYA_BY_WILAYA: Record<number, Baladiya[]> = {
  // 01 - Adrar
  1: [
    { code: "0170", name: "ADRAR" },
    { code: "0119", name: "AKABLI" },
    { code: "0179", name: "AOUGROUT" },
    { code: "0176", name: "AOULEF" },
    { code: "0180", name: "BORDJ BADJI MOKHTAR" },
    { code: "0172", name: "REGGANE" },
    { code: "0174", name: "TIMIMOUN" },
  ],

  // 02 - Chlef
  2: [
    { code: "0270", name: "CHLEF" },
    { code: "0276", name: "BOUKADIR" },
    { code: "0280", name: "OUED FODDA" },
    { code: "0271", name: "TENES" },
    { code: "0282", name: "AIN MERANE" },
  ],

  // 03 - Laghouat
  3: [
    { code: "0370", name: "LAGHOUAT" },
    { code: "0378", name: "AFLOU" },
    { code: "0373", name: "HASSI R'MEL" },
  ],

  // 04 - Oum El Bouaghi
  4: [
    { code: "0470", name: "OUM EL BOUAGHI" },
    { code: "0472", name: "AIN BEIDA" },
    { code: "0479", name: "AIN M'LILA" },
    { code: "0476", name: "MESKIANA" },
  ],

  // 05 - Batna
  5: [
    { code: "0570", name: "BATNA" },
    { code: "0583", name: "BARIKA" },
    { code: "0586", name: "AIN TOUTA" },
    { code: "0577", name: "ARRIS" },
    { code: "0588", name: "TIMGAD" },
    { code: "0571", name: "MEROUANA" },
  ],

  // 06 - Béjaïa
  6: [
    { code: "0670", name: "BEJAIA" },
    { code: "0679", name: "AKBOU" },
    { code: "0671", name: "AMIZOUR" },
    { code: "0681", name: "TAZMALT" },
    { code: "0687", name: "KHERRATA" },
  ],

  // 07 - Biskra
  7: [
    { code: "0770", name: "BISKRA" },
    { code: "0771", name: "OULED DJELLAL" },
    { code: "0779", name: "TOLGA" },
    { code: "0772", name: "SIDI KHALED" },
  ],

  // 08 - Béchar
  8: [
    { code: "0870", name: "BECHAR" },
    { code: "0873", name: "BENI-ABBES" },
    { code: "0874", name: "KENADSA" },
  ],

  // 09 - Blida
  9: [
    { code: "0970", name: "BLIDA" },
    { code: "0977", name: "BOUFARIK" },
    { code: "0979", name: "BOUGARA" },
    { code: "0978", name: "LARBAA" },
    { code: "0976", name: "MEFTAH" },
    { code: "0974", name: "EL-AFFROUN" },
    { code: "0975", name: "MOUZAIA" },
  ],

  // 10 - Bouira
  10: [
    { code: "1070", name: "BOUIRA" },
    { code: "1074", name: "LAKHDARIA" },
    { code: "1081", name: "SOUR EL GHOZLANE" },
    { code: "1080", name: "M CHEDALLAH" },
  ],

  // 11 - Tamanrasset
  11: [
    { code: "1170", name: "TAMANRASSET" },
    { code: "1171", name: "IN GUEZZAM" },
    { code: "1172", name: "IN SALAH" },
  ],

  // 12 - Tébessa
  12: [
    { code: "1270", name: "TEBESSA" },
    { code: "1274", name: "BIR EL ATER" },
    { code: "1276", name: "CHERIA" },
  ],

  // 13 - Tlemcen
  13: [
    { code: "1370", name: "TLEMCEN" },
    { code: "1381", name: "MAGHNIA" },
    { code: "1374", name: "GHAZAOUET" },
    { code: "1372", name: "REMCHI" },
    { code: "1382", name: "SEBDOU" },
  ],

  // 14 - Tiaret
  14: [
    { code: "1470", name: "TIARET" },
    { code: "1472", name: "FRENDA" },
    { code: "1478", name: "SOUGUEUR" },
  ],

  // 15 - Tizi Ouzou
  15: [
    { code: "1570", name: "TIZI OUZOU" },
    { code: "1571", name: "AZAZGA" },
    { code: "1579", name: "DRAA EL MIZAN" },
    { code: "1576", name: "AIN EL HAMMAM" },
    { code: "1572", name: "LARBA NATH IRATHEN" },
    { code: "1573", name: "BOGHNI" },
  ],

  // 16 - Alger
  16: [
    { code: "1601", name: "ALGER CENTRE" },
    { code: "1621", name: "BAB EZZOUAR" },
    { code: "1630", name: "BORDJ EL KIFFAN" },
    { code: "1571", name: "BOUDOUAOU" },
    { code: "1672", name: "BIR MOURAD RAIS" },
    { code: "1682", name: "CHERAGA" },
    { code: "1677", name: "DAR EL BEIDA" },
    { code: "1648", name: "DOUERA" },
    { code: "1681", name: "DRARIA" },
    { code: "1654", name: "EL ACHOUR" },
    { code: "1610", name: "EL BIAR" },
    { code: "1674", name: "EL HARRACH" },
    { code: "1676", name: "HUSSEIN DEY" },
    { code: "1618", name: "KOUBA" },
    { code: "1640", name: "REGHAIA" },
    { code: "1679", name: "ROUIBA" },
    { code: "1670", name: "SIDI M'HAMED" },
    { code: "1680", name: "ZERALDA" },
    { code: "1671", name: "BAB EL OUED" },
    { code: "1657", name: "AIN BENIAN" },
    { code: "1673", name: "BOUZAREAH" },
    { code: "1612", name: "BIRKHADEM" },
    { code: "1653", name: "STAOUELI" },
    { code: "1675", name: "BARAKI" },
  ],

  // 17 - Djelfa
  17: [
    { code: "1770", name: "DJELFA" },
    { code: "1781", name: "AIN OUSSERA" },
    { code: "1775", name: "MESSAAD" },
    { code: "1771", name: "HASSI BAHBAH" },
  ],

  // 18 - Jijel
  18: [
    { code: "1870", name: "JIJEL" },
    { code: "1875", name: "EL MILIA" },
    { code: "1873", name: "TAHER" },
  ],

  // 19 - Sétif
  19: [
    { code: "1970", name: "SETIF" },
    { code: "1971", name: "EL EULMA" },
    { code: "1978", name: "AIN OULMENE" },
    { code: "1977", name: "BIR EL ARCH" },
    { code: "1974", name: "AIN AZEL" },
    { code: "1979", name: "BOUGAA" },
  ],

  // 20 - Saïda
  20: [
    { code: "2070", name: "SAIDA" },
    { code: "2072", name: "AIN EL HADJAR" },
  ],

  // 21 - Skikda
  21: [
    { code: "2170", name: "SKIKDA" },
    { code: "2176", name: "COLLO" },
    { code: "2177", name: "AZZABA" },
  ],

  // 22 - Sidi Bel Abbès
  22: [
    { code: "2270", name: "SIDI BEL ABBES" },
    { code: "2271", name: "TELAGH" },
    { code: "2278", name: "BEN BADIS" },
  ],

  // 23 - Annaba
  23: [
    { code: "2371", name: "ANNABA" },
    { code: "2374", name: "EL BOUNI" },
    { code: "2375", name: "EL HADJAR" },
    { code: "2372", name: "BERRAHAL" },
  ],

  // 24 - Guelma
  24: [
    { code: "2470", name: "GUELMA" },
    { code: "2477", name: "BOUCHEGOUF" },
    { code: "2471", name: "OUED ZENATI" },
  ],

  // 25 - Constantine
  25: [
    { code: "2570", name: "CONSTANTINE" },
    { code: "2573", name: "EL KHROUB" },
    { code: "2571", name: "HAMMA BOUZIANE" },
    { code: "2574", name: "AIN ABID" },
    { code: "2583", name: "ALI MENDJLI" },
    { code: "2505", name: "DIDOUCHE MOURAD" },
  ],

  // 26 - Médéa
  26: [
    { code: "2670", name: "MEDEA" },
    { code: "2685", name: "BERROUAGHIA" },
    { code: "2687", name: "TABLAT" },
    { code: "2679", name: "KSAR EL BOUKHARI" },
  ],

  // 27 - Mostaganem
  27: [
    { code: "2770", name: "MOSTAGANEM" },
    { code: "2773", name: "AIN-TEDLES" },
    { code: "2778", name: "BOUGUIRAT" },
  ],

  // 28 - M'Sila
  28: [
    { code: "2870", name: "M'SILA" },
    { code: "2874", name: "BOU SAADA" },
    { code: "2878", name: "SIDI AISSA" },
  ],

  // 29 - Mascara
  29: [
    { code: "2970", name: "MASCARA" },
    { code: "2982", name: "SIG" },
    { code: "2985", name: "MOHAMMADIA" },
  ],

  // 30 - Ouargla
  30: [
    { code: "3070", name: "OUARGLA" },
    { code: "3071", name: "HASSI MESSAOUD" },
    { code: "3079", name: "TOUGGOURT" },
  ],

  // 31 - Oran
  31: [
    { code: "3170", name: "ORAN" },
    { code: "3171", name: "ARZEW" },
    { code: "3174", name: "AIN TURK" },
    { code: "3178", name: "ES SENIA" },
    { code: "3172", name: "BIR EL DJIR" },
    { code: "3177", name: "GDYEL" },
    { code: "3179", name: "BETHIOUA" },
    { code: "3175", name: "MERS EL KEBIR" },
    { code: "3181", name: "HASSI BOUNIF" },
    { code: "3182", name: "BOUTLELIS" },
  ],

  // 32 - El Bayadh
  32: [
    { code: "3270", name: "EL BAYADH" },
    { code: "3271", name: "BOUGTOB" },
  ],

  // 33 - Illizi
  33: [
    { code: "3370", name: "ILLIZI" },
    { code: "3371", name: "DJANET" },
    { code: "3372", name: "IN AMENAS" },
  ],

  // 34 - Bordj Bou Arréridj
  34: [
    { code: "3470", name: "B.B.ARRERIDJ" },
    { code: "3471", name: "RAS EL OUED" },
    { code: "3474", name: "AIN TAGHROUT" },
  ],

  // 35 - Boumerdès
  35: [
    { code: "3570", name: "BOUMERDES" },
    { code: "3571", name: "BOUDOUAOU" },
    { code: "3572", name: "BORDJ MENAIEL" },
    { code: "3576", name: "DELLYS" },
    { code: "3577", name: "KHEMIS EL KHECHNA" },
  ],

  // 36 - El Tarf
  36: [
    { code: "3670", name: "EL TARF" },
    { code: "3673", name: "EL KALA" },
    { code: "3675", name: "DREAN" },
  ],

  // 37 - Tindouf
  37: [
    { code: "3770", name: "TINDOUF" },
  ],

  // 38 - Tissemsilt
  38: [
    { code: "3870", name: "TISSEMSILT" },
    { code: "3871", name: "THENIET EL HAD" },
  ],

  // 39 - El Oued
  39: [
    { code: "3970", name: "EL-OUED" },
    { code: "3981", name: "DJAMAA" },
    { code: "3980", name: "EL-M'GHAIER" },
  ],

  // 40 - Khenchela
  40: [
    { code: "4070", name: "KHENCHELA" },
    { code: "4072", name: "KAIS" },
  ],

  // 41 - Souk Ahras
  41: [
    { code: "4170", name: "SOUK AHRAS" },
    { code: "4171", name: "SEDRATA" },
  ],

  // 42 - Tipaza
  42: [
    { code: "4270", name: "TIPAZA" },
    { code: "4276", name: "KOLEA" },
    { code: "4271", name: "CHERCHELL" },
    { code: "4277", name: "HADJOUT" },
    { code: "4278", name: "FOUKA" },
  ],

  // 43 - Mila
  43: [
    { code: "4370", name: "MILA" },
    { code: "4372", name: "CHELGHOUM LAID" },
    { code: "4371", name: "FERDJIOUA" },
  ],

  // 44 - Aïn Defla
  44: [
    { code: "4470", name: "AIN-DEFLA" },
    { code: "4473", name: "KHEMIS-MILIANA" },
    { code: "4471", name: "MILIANA" },
  ],

  // 45 - Naâma
  45: [
    { code: "4570", name: "NAAMA" },
    { code: "4571", name: "MECHERIA" },
    { code: "4572", name: "AIN SEFRA" },
  ],

  // 46 - Aïn Témouchent
  46: [
    { code: "4670", name: "AIN TEMOUCHENT" },
    { code: "4676", name: "BENI SAF" },
    { code: "4671", name: "HAMMAM BOUHADJAR" },
  ],

  // 47 - Ghardaïa
  47: [
    { code: "4770", name: "GHARDAIA" },
    { code: "4771", name: "EL MENIAA" },
    { code: "4773", name: "BERRIANE" },
    { code: "4774", name: "METLILI" },
  ],

  // 48 - Relizane
  48: [
    { code: "4870", name: "RELIZANE" },
    { code: "4871", name: "OUED RHIOU" },
    { code: "4877", name: "MAZOUNA" },
  ],

  // 49 - El M'Ghair
  49: [
    { code: "4970", name: "EL M'GHAIR" },
    { code: "4971", name: "DJAMAA" },
  ],

  // 50 - El Meniaa
  50: [
    { code: "5070", name: "EL MENIAA" },
  ],

  // 51 - Ouled Djellal
  51: [
    { code: "5170", name: "OULED DJELLAL" },
    { code: "5171", name: "SIDI KHALED" },
  ],

  // 52 - Bordj Baji Mokhtar
  52: [
    { code: "5270", name: "BORDJ BAJI MOKHTAR" },
  ],

  // 53 - Béni Abbès
  53: [
    { code: "5370", name: "BENI ABBES" },
  ],

  // 54 - Timimoun
  54: [
    { code: "5470", name: "TIMIMOUN" },
  ],

  // 55 - Touggourt
  55: [
    { code: "5570", name: "TOUGGOURT" },
    { code: "5571", name: "TEMACINE" },
  ],

  // 56 - Djanet
  56: [
    { code: "5670", name: "DJANET" },
  ],

  // 57 - In Salah
  57: [
    { code: "5770", name: "IN SALAH" },
  ],

  // 58 - In Guezzam
  58: [
    { code: "5870", name: "IN GUEZZAM" },
  ],
};

/**
 * Get baladiyas (communes) for a specific wilaya
 */
export function getBaladiyasForWilaya(wilayaId: number): Baladiya[] {
  return BALADIYA_BY_WILAYA[wilayaId] ?? [];
}

/**
 * Get baladiya by code
 */
export function getBaladiyaByCode(code: string): Baladiya | undefined {
  for (const wilayas of Object.values(BALADIYA_BY_WILAYA)) {
    const found = wilayas.find(b => b.code === code);
    if (found) return found;
  }
  return undefined;
}
