/**
 * Mock Data for Rime Couture E-commerce
 * Comprehensive seed data covering all database tables
 */

// ============================================================================
// USERS
// ============================================================================
export const mockUsers = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'admin@rimecouture.dz',
    role: 'ADMIN' as const,
    displayName: 'Admin',
    phone: '+213555000001',
    preferredLocale: 'EN' as const,
    emailVerifiedAt: new Date('2024-01-01'),
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'fatima.benali@gmail.com',
    role: 'CLIENT' as const,
    displayName: 'Fatima Benali',
    phone: '+213555123456',
    preferredLocale: 'AR' as const,
    emailVerifiedAt: new Date('2024-06-15'),
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'sarah.hadj@outlook.com',
    role: 'CLIENT' as const,
    displayName: 'Sarah Hadj',
    phone: '+213661234567',
    preferredLocale: 'FR' as const,
    emailVerifiedAt: new Date('2024-08-20'),
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    email: 'amina.kaci@yahoo.fr',
    role: 'CLIENT' as const,
    displayName: 'Amina Kaci',
    phone: '+213770987654',
    preferredLocale: 'FR' as const,
    emailVerifiedAt: new Date('2024-09-10'),
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    email: 'nour.ahmed@gmail.com',
    role: 'CLIENT' as const,
    displayName: 'Nour Ahmed',
    phone: '+213555654321',
    preferredLocale: 'EN' as const,
    emailVerifiedAt: null,
  },
];

// ============================================================================
// CATEGORIES
// ============================================================================
export const mockCategories = [
  {
    id: 'cat-11111111-1111-1111-1111-111111111111',
    slug: 'kids-dresses',
    sortOrder: 1,
    isActive: true,
    translations: [
      { locale: 'EN' as const, name: 'Kids Dresses', description: 'Beautiful hand-sewn dresses for little girls' },
      { locale: 'FR' as const, name: 'Robes Enfants', description: 'Belles robes cousues main pour petites filles' },
      { locale: 'AR' as const, name: 'فساتين أطفال', description: 'فساتين جميلة مخيطة يدوياً للفتيات الصغيرات' },
    ],
  },
  {
    id: 'cat-22222222-2222-2222-2222-222222222222',
    slug: 'home-textiles',
    sortOrder: 2,
    isActive: true,
    translations: [
      { locale: 'EN' as const, name: 'Home Textiles', description: 'Premium quality home textiles and linens' },
      { locale: 'FR' as const, name: 'Textiles Maison', description: 'Textiles et linges de maison de qualité premium' },
      { locale: 'AR' as const, name: 'مفروشات منزلية', description: 'مفروشات وأقمشة منزلية عالية الجودة' },
    ],
  },
  {
    id: 'cat-33333333-3333-3333-3333-333333333333',
    slug: 'kitchen-accessories',
    sortOrder: 3,
    isActive: true,
    translations: [
      { locale: 'EN' as const, name: 'Kitchen Accessories', description: 'Handcrafted kitchen aprons and accessories' },
      { locale: 'FR' as const, name: 'Accessoires Cuisine', description: 'Tabliers et accessoires de cuisine artisanaux' },
      { locale: 'AR' as const, name: 'إكسسوارات المطبخ', description: 'مآزر وإكسسوارات مطبخ مصنوعة يدوياً' },
    ],
  },
];

// ============================================================================
// COLORS
// ============================================================================
export const mockColors = [
  {
    id: 'col-11111111-1111-1111-1111-111111111111',
    code: 'pink',
    hex: '#FF6B9D',
    sortOrder: 1,
    translations: [
      { locale: 'EN' as const, label: 'Pink' },
      { locale: 'FR' as const, label: 'Rose' },
      { locale: 'AR' as const, label: 'وردي' },
    ],
  },
  {
    id: 'col-22222222-2222-2222-2222-222222222222',
    code: 'white',
    hex: '#FFFFFF',
    sortOrder: 2,
    translations: [
      { locale: 'EN' as const, label: 'White' },
      { locale: 'FR' as const, label: 'Blanc' },
      { locale: 'AR' as const, label: 'أبيض' },
    ],
  },
  {
    id: 'col-33333333-3333-3333-3333-333333333333',
    code: 'blue',
    hex: '#4A90D9',
    sortOrder: 3,
    translations: [
      { locale: 'EN' as const, label: 'Blue' },
      { locale: 'FR' as const, label: 'Bleu' },
      { locale: 'AR' as const, label: 'أزرق' },
    ],
  },
  {
    id: 'col-44444444-4444-4444-4444-444444444444',
    code: 'red',
    hex: '#E53935',
    sortOrder: 4,
    translations: [
      { locale: 'EN' as const, label: 'Red' },
      { locale: 'FR' as const, label: 'Rouge' },
      { locale: 'AR' as const, label: 'أحمر' },
    ],
  },
  {
    id: 'col-55555555-5555-5555-5555-555555555555',
    code: 'black',
    hex: '#1A1A1A',
    sortOrder: 5,
    translations: [
      { locale: 'EN' as const, label: 'Black' },
      { locale: 'FR' as const, label: 'Noir' },
      { locale: 'AR' as const, label: 'أسود' },
    ],
  },
  {
    id: 'col-66666666-6666-6666-6666-666666666666',
    code: 'beige',
    hex: '#F5F0E6',
    sortOrder: 6,
    translations: [
      { locale: 'EN' as const, label: 'Beige' },
      { locale: 'FR' as const, label: 'Beige' },
      { locale: 'AR' as const, label: 'بيج' },
    ],
  },
  {
    id: 'col-77777777-7777-7777-7777-777777777777',
    code: 'lavender',
    hex: '#B794F6',
    sortOrder: 7,
    translations: [
      { locale: 'EN' as const, label: 'Lavender' },
      { locale: 'FR' as const, label: 'Lavande' },
      { locale: 'AR' as const, label: 'لافندر' },
    ],
  },
  {
    id: 'col-88888888-8888-8888-8888-888888888888',
    code: 'mint',
    hex: '#98D8C8',
    sortOrder: 8,
    translations: [
      { locale: 'EN' as const, label: 'Mint Green' },
      { locale: 'FR' as const, label: 'Vert Menthe' },
      { locale: 'AR' as const, label: 'أخضر نعناعي' },
    ],
  },
];

// ============================================================================
// SIZES
// ============================================================================
export const mockSizes = [
  // Kids sizes
  {
    id: 'size-11111111-1111-1111-1111-111111111111',
    code: '2Y',
    sortOrder: 1,
    translations: [
      { locale: 'EN' as const, label: '2 Years' },
      { locale: 'FR' as const, label: '2 Ans' },
      { locale: 'AR' as const, label: 'سنتان' },
    ],
  },
  {
    id: 'size-22222222-2222-2222-2222-222222222222',
    code: '3Y',
    sortOrder: 2,
    translations: [
      { locale: 'EN' as const, label: '3 Years' },
      { locale: 'FR' as const, label: '3 Ans' },
      { locale: 'AR' as const, label: '3 سنوات' },
    ],
  },
  {
    id: 'size-33333333-3333-3333-3333-333333333333',
    code: '4Y',
    sortOrder: 3,
    translations: [
      { locale: 'EN' as const, label: '4 Years' },
      { locale: 'FR' as const, label: '4 Ans' },
      { locale: 'AR' as const, label: '4 سنوات' },
    ],
  },
  {
    id: 'size-44444444-4444-4444-4444-444444444444',
    code: '5Y',
    sortOrder: 4,
    translations: [
      { locale: 'EN' as const, label: '5 Years' },
      { locale: 'FR' as const, label: '5 Ans' },
      { locale: 'AR' as const, label: '5 سنوات' },
    ],
  },
  {
    id: 'size-55555555-5555-5555-5555-555555555555',
    code: '6Y',
    sortOrder: 5,
    translations: [
      { locale: 'EN' as const, label: '6 Years' },
      { locale: 'FR' as const, label: '6 Ans' },
      { locale: 'AR' as const, label: '6 سنوات' },
    ],
  },
  // Home textile sizes
  {
    id: 'size-66666666-6666-6666-6666-666666666666',
    code: 'SINGLE',
    sortOrder: 10,
    translations: [
      { locale: 'EN' as const, label: 'Single' },
      { locale: 'FR' as const, label: 'Simple' },
      { locale: 'AR' as const, label: 'مفرد' },
    ],
  },
  {
    id: 'size-77777777-7777-7777-7777-777777777777',
    code: 'DOUBLE',
    sortOrder: 11,
    translations: [
      { locale: 'EN' as const, label: 'Double' },
      { locale: 'FR' as const, label: 'Double' },
      { locale: 'AR' as const, label: 'مزدوج' },
    ],
  },
  {
    id: 'size-88888888-8888-8888-8888-888888888888',
    code: 'ONESIZE',
    sortOrder: 20,
    translations: [
      { locale: 'EN' as const, label: 'One Size' },
      { locale: 'FR' as const, label: 'Taille Unique' },
      { locale: 'AR' as const, label: 'مقاس واحد' },
    ],
  },
];

// ============================================================================
// TAGS
// ============================================================================
export const mockTags = [
  // Materials
  {
    id: 'tag-11111111-1111-1111-1111-111111111111',
    type: 'MATERIAL' as const,
    slug: 'cotton',
    sortOrder: 1,
    translations: [
      { locale: 'EN' as const, label: 'Cotton' },
      { locale: 'FR' as const, label: 'Coton' },
      { locale: 'AR' as const, label: 'قطن' },
    ],
  },
  {
    id: 'tag-22222222-2222-2222-2222-222222222222',
    type: 'MATERIAL' as const,
    slug: 'silk',
    sortOrder: 2,
    translations: [
      { locale: 'EN' as const, label: 'Silk' },
      { locale: 'FR' as const, label: 'Soie' },
      { locale: 'AR' as const, label: 'حرير' },
    ],
  },
  {
    id: 'tag-33333333-3333-3333-3333-333333333333',
    type: 'MATERIAL' as const,
    slug: 'linen',
    sortOrder: 3,
    translations: [
      { locale: 'EN' as const, label: 'Linen' },
      { locale: 'FR' as const, label: 'Lin' },
      { locale: 'AR' as const, label: 'كتان' },
    ],
  },
  // Seasons
  {
    id: 'tag-44444444-4444-4444-4444-444444444444',
    type: 'MOOD_SEASON' as const,
    slug: 'summer',
    sortOrder: 1,
    translations: [
      { locale: 'EN' as const, label: 'Summer' },
      { locale: 'FR' as const, label: 'Été' },
      { locale: 'AR' as const, label: 'صيف' },
    ],
  },
  {
    id: 'tag-55555555-5555-5555-5555-555555555555',
    type: 'MOOD_SEASON' as const,
    slug: 'spring',
    sortOrder: 2,
    translations: [
      { locale: 'EN' as const, label: 'Spring' },
      { locale: 'FR' as const, label: 'Printemps' },
      { locale: 'AR' as const, label: 'ربيع' },
    ],
  },
  // Patterns
  {
    id: 'tag-66666666-6666-6666-6666-666666666666',
    type: 'PATTERN' as const,
    slug: 'floral',
    sortOrder: 1,
    translations: [
      { locale: 'EN' as const, label: 'Floral' },
      { locale: 'FR' as const, label: 'Floral' },
      { locale: 'AR' as const, label: 'زهري' },
    ],
  },
  {
    id: 'tag-77777777-7777-7777-7777-777777777777',
    type: 'PATTERN' as const,
    slug: 'striped',
    sortOrder: 2,
    translations: [
      { locale: 'EN' as const, label: 'Striped' },
      { locale: 'FR' as const, label: 'Rayé' },
      { locale: 'AR' as const, label: 'مخطط' },
    ],
  },
  // Occasions
  {
    id: 'tag-88888888-8888-8888-8888-888888888888',
    type: 'OCCASION' as const,
    slug: 'party',
    sortOrder: 1,
    translations: [
      { locale: 'EN' as const, label: 'Party' },
      { locale: 'FR' as const, label: 'Fête' },
      { locale: 'AR' as const, label: 'حفلة' },
    ],
  },
  {
    id: 'tag-99999999-9999-9999-9999-999999999999',
    type: 'OCCASION' as const,
    slug: 'casual',
    sortOrder: 2,
    translations: [
      { locale: 'EN' as const, label: 'Casual' },
      { locale: 'FR' as const, label: 'Décontracté' },
      { locale: 'AR' as const, label: 'عادي' },
    ],
  },
];

// ============================================================================
// MEDIA ASSETS
// ============================================================================
export const mockMediaAssets = [
  // Product images
  {
    id: 'media-11111111-1111-1111-1111-111111111111',
    kind: 'IMAGE' as const,
    url: 'https://images.pexels.com/photos/35188/child-childrens-baby-children-s.jpg?auto=compress&cs=tinysrgb&w=800',
    mimeType: 'image/jpeg',
    width: 800,
    height: 1200,
  },
  {
    id: 'media-22222222-2222-2222-2222-222222222222',
    kind: 'IMAGE' as const,
    url: 'https://images.pexels.com/photos/6274665/pexels-photo-6274665.jpeg?auto=compress&cs=tinysrgb&w=800',
    mimeType: 'image/jpeg',
    width: 800,
    height: 1200,
  },
  {
    id: 'media-33333333-3333-3333-3333-333333333333',
    kind: 'IMAGE' as const,
    url: 'https://images.pexels.com/photos/36029/aroni-arsa-children-little.jpg?auto=compress&cs=tinysrgb&w=800',
    mimeType: 'image/jpeg',
    width: 800,
    height: 1200,
  },
  {
    id: 'media-44444444-4444-4444-4444-444444444444',
    kind: 'IMAGE' as const,
    url: 'https://images.pexels.com/photos/6311392/pexels-photo-6311392.jpeg?auto=compress&cs=tinysrgb&w=800',
    mimeType: 'image/jpeg',
    width: 800,
    height: 1200,
  },
  {
    id: 'media-55555555-5555-5555-5555-555555555555',
    kind: 'IMAGE' as const,
    url: 'https://images.pexels.com/photos/5593101/pexels-photo-5593101.jpeg?auto=compress&cs=tinysrgb&w=800',
    mimeType: 'image/jpeg',
    width: 800,
    height: 1200,
  },
  {
    id: 'media-66666666-6666-6666-6666-666666666666',
    kind: 'IMAGE' as const,
    url: 'https://images.pexels.com/photos/6621361/pexels-photo-6621361.jpeg?auto=compress&cs=tinysrgb&w=800',
    mimeType: 'image/jpeg',
    width: 800,
    height: 1200,
  },
  {
    id: 'media-77777777-7777-7777-7777-777777777777',
    kind: 'IMAGE' as const,
    url: 'https://images.pexels.com/photos/3771679/pexels-photo-3771679.jpeg?auto=compress&cs=tinysrgb&w=800',
    mimeType: 'image/jpeg',
    width: 800,
    height: 1200,
  },
  {
    id: 'media-88888888-8888-8888-8888-888888888888',
    kind: 'IMAGE' as const,
    url: 'https://images.pexels.com/photos/5699516/pexels-photo-5699516.jpeg?auto=compress&cs=tinysrgb&w=800',
    mimeType: 'image/jpeg',
    width: 800,
    height: 1200,
  },
];

// ============================================================================
// PRODUCTS
// ============================================================================
export const mockProducts = [
  {
    id: 'prod-11111111-1111-1111-1111-111111111111',
    slug: 'floral-cotton-dress',
    categoryId: 'cat-11111111-1111-1111-1111-111111111111',
    status: 'PUBLISHED' as const,
    basePriceMinor: 459900, // 4599.00 DZD
    isCustomizable: true,
    isMadeToOrder: false,
    isFeatured: true,
    featuredOrder: 1,
    salesCount: 45,
    wishlistCount: 120,
    reviewCount: 24,
    avgRating: 4.8,
    translations: [
      {
        locale: 'EN' as const,
        name: 'Floral Cotton Dress',
        description: 'Beautiful hand-sewn floral cotton dress perfect for summer days. Made with 100% organic cotton, featuring delicate flower patterns and comfortable fit for active little girls.',
        seoTitle: 'Floral Cotton Dress for Girls | Rime Couture',
        seoDescription: 'Shop beautiful hand-sewn floral cotton dress. Perfect for summer, 100% organic cotton.',
      },
      {
        locale: 'FR' as const,
        name: 'Robe Florale en Coton',
        description: 'Belle robe florale en coton cousue main, parfaite pour les journées d\'été. Fabriquée en coton 100% biologique avec des motifs floraux délicats.',
        seoTitle: 'Robe Florale en Coton pour Filles | Rime Couture',
        seoDescription: 'Achetez une belle robe florale en coton cousue main. Parfaite pour l\'été.',
      },
      {
        locale: 'AR' as const,
        name: 'فستان قطني بنقشة الزهور',
        description: 'فستان قطني جميل مخيط يدوياً بنقشة الزهور، مثالي لأيام الصيف. مصنوع من قطن عضوي 100٪ مع نقوش زهور رقيقة.',
        seoTitle: 'فستان قطني بنقشة الزهور للفتيات | ريم كوتور',
        seoDescription: 'تسوقي فستان قطني بنقشة الزهور مخيط يدوياً. مثالي للصيف.',
      },
    ],
    media: [
      { mediaId: 'media-11111111-1111-1111-1111-111111111111', position: 0, isThumb: true },
    ],
    tags: ['tag-11111111-1111-1111-1111-111111111111', 'tag-44444444-4444-4444-4444-444444444444', 'tag-66666666-6666-6666-6666-666666666666'],
    variants: [
      { variantKey: 'pink-2Y', sku: 'FCD-PINK-2Y', sizeId: 'size-11111111-1111-1111-1111-111111111111', colorId: 'col-11111111-1111-1111-1111-111111111111', stock: 5 },
      { variantKey: 'pink-3Y', sku: 'FCD-PINK-3Y', sizeId: 'size-22222222-2222-2222-2222-222222222222', colorId: 'col-11111111-1111-1111-1111-111111111111', stock: 8 },
      { variantKey: 'pink-4Y', sku: 'FCD-PINK-4Y', sizeId: 'size-33333333-3333-3333-3333-333333333333', colorId: 'col-11111111-1111-1111-1111-111111111111', stock: 6 },
      { variantKey: 'white-2Y', sku: 'FCD-WHITE-2Y', sizeId: 'size-11111111-1111-1111-1111-111111111111', colorId: 'col-22222222-2222-2222-2222-222222222222', stock: 4 },
      { variantKey: 'white-3Y', sku: 'FCD-WHITE-3Y', sizeId: 'size-22222222-2222-2222-2222-222222222222', colorId: 'col-22222222-2222-2222-2222-222222222222', stock: 7 },
    ],
  },
  {
    id: 'prod-22222222-2222-2222-2222-222222222222',
    slug: 'silk-pillowcase-set',
    categoryId: 'cat-22222222-2222-2222-2222-222222222222',
    status: 'PUBLISHED' as const,
    basePriceMinor: 299900, // 2999.00 DZD
    isCustomizable: false,
    isMadeToOrder: false,
    isFeatured: true,
    featuredOrder: 2,
    salesCount: 89,
    wishlistCount: 200,
    reviewCount: 56,
    avgRating: 4.9,
    translations: [
      {
        locale: 'EN' as const,
        name: 'Silk Pillowcase Set',
        description: 'Luxurious silk pillowcase set for beautiful hair and skin. Natural mulberry silk, gentle on your skin while you sleep. Set includes 2 pillowcases.',
        seoTitle: 'Silk Pillowcase Set | Premium Home Textiles',
        seoDescription: 'Luxurious mulberry silk pillowcase set. Gentle on hair and skin.',
      },
      {
        locale: 'FR' as const,
        name: 'Ensemble Taies en Soie',
        description: 'Ensemble de taies d\'oreiller en soie luxueuse pour de beaux cheveux et une belle peau. Soie de mûrier naturelle.',
        seoTitle: 'Ensemble Taies en Soie | Textiles Maison Premium',
        seoDescription: 'Ensemble taies d\'oreiller en soie de mûrier luxueuse.',
      },
      {
        locale: 'AR' as const,
        name: 'طقم أغطية وسائد حريرية',
        description: 'طقم أغطية وسائد حريرية فاخرة للحفاظ على جمال شعرك وبشرتك. حرير التوت الطبيعي.',
        seoTitle: 'طقم أغطية وسائد حريرية | مفروشات فاخرة',
        seoDescription: 'طقم أغطية وسائد من حرير التوت الفاخر.',
      },
    ],
    media: [
      { mediaId: 'media-44444444-4444-4444-4444-444444444444', position: 0, isThumb: true },
    ],
    tags: ['tag-22222222-2222-2222-2222-222222222222'],
    variants: [
      { variantKey: 'white-single', sku: 'SPS-WHITE-S', sizeId: 'size-66666666-6666-6666-6666-666666666666', colorId: 'col-22222222-2222-2222-2222-222222222222', stock: 15 },
      { variantKey: 'white-double', sku: 'SPS-WHITE-D', sizeId: 'size-77777777-7777-7777-7777-777777777777', colorId: 'col-22222222-2222-2222-2222-222222222222', stock: 12 },
      { variantKey: 'beige-single', sku: 'SPS-BEIGE-S', sizeId: 'size-66666666-6666-6666-6666-666666666666', colorId: 'col-66666666-6666-6666-6666-666666666666', stock: 10 },
      { variantKey: 'lavender-single', sku: 'SPS-LAV-S', sizeId: 'size-66666666-6666-6666-6666-666666666666', colorId: 'col-77777777-7777-7777-7777-777777777777', stock: 8 },
    ],
  },
  {
    id: 'prod-33333333-3333-3333-3333-333333333333',
    slug: 'pastel-party-dress',
    categoryId: 'cat-11111111-1111-1111-1111-111111111111',
    status: 'PUBLISHED' as const,
    basePriceMinor: 650000, // 6500.00 DZD
    isCustomizable: true,
    isMadeToOrder: true,
    leadTimeDays: 7,
    isFeatured: true,
    featuredOrder: 3,
    salesCount: 28,
    wishlistCount: 95,
    reviewCount: 12,
    avgRating: 5.0,
    translations: [
      {
        locale: 'EN' as const,
        name: 'Pastel Party Dress',
        description: 'Stunning pastel party dress for special occasions. Hand-sewn with premium fabrics, featuring delicate lace details and a beautiful tulle skirt.',
        seoTitle: 'Pastel Party Dress for Girls | Special Occasions',
        seoDescription: 'Stunning hand-sewn pastel party dress with lace details.',
      },
      {
        locale: 'FR' as const,
        name: 'Robe de Fête Pastel',
        description: 'Magnifique robe de fête pastel pour occasions spéciales. Cousue main avec des tissus premium et détails en dentelle.',
        seoTitle: 'Robe de Fête Pastel pour Filles | Occasions Spéciales',
        seoDescription: 'Magnifique robe de fête pastel cousue main.',
      },
      {
        locale: 'AR' as const,
        name: 'فستان حفلات باستيل',
        description: 'فستان حفلات باستيل رائع للمناسبات الخاصة. مخيط يدوياً من أقمشة فاخرة مع تفاصيل دانتيل رقيقة.',
        seoTitle: 'فستان حفلات باستيل للفتيات | مناسبات خاصة',
        seoDescription: 'فستان حفلات باستيل مخيط يدوياً.',
      },
    ],
    media: [
      { mediaId: 'media-22222222-2222-2222-2222-222222222222', position: 0, isThumb: true },
    ],
    tags: ['tag-88888888-8888-8888-8888-888888888888', 'tag-55555555-5555-5555-5555-555555555555'],
    variants: [
      { variantKey: 'pink-3Y', sku: 'PPD-PINK-3Y', sizeId: 'size-22222222-2222-2222-2222-222222222222', colorId: 'col-11111111-1111-1111-1111-111111111111', stock: 3 },
      { variantKey: 'pink-4Y', sku: 'PPD-PINK-4Y', sizeId: 'size-33333333-3333-3333-3333-333333333333', colorId: 'col-11111111-1111-1111-1111-111111111111', stock: 4 },
      { variantKey: 'lavender-3Y', sku: 'PPD-LAV-3Y', sizeId: 'size-22222222-2222-2222-2222-222222222222', colorId: 'col-77777777-7777-7777-7777-777777777777', stock: 2 },
      { variantKey: 'lavender-4Y', sku: 'PPD-LAV-4Y', sizeId: 'size-33333333-3333-3333-3333-333333333333', colorId: 'col-77777777-7777-7777-7777-777777777777', stock: 3 },
    ],
  },
  {
    id: 'prod-44444444-4444-4444-4444-444444444444',
    slug: 'cotton-tablecloth',
    categoryId: 'cat-22222222-2222-2222-2222-222222222222',
    status: 'PUBLISHED' as const,
    basePriceMinor: 399900, // 3999.00 DZD
    isCustomizable: false,
    isMadeToOrder: false,
    isFeatured: true,
    featuredOrder: 4,
    salesCount: 62,
    wishlistCount: 85,
    reviewCount: 38,
    avgRating: 4.6,
    translations: [
      {
        locale: 'EN' as const,
        name: 'Premium Cotton Tablecloth',
        description: 'Elegant premium cotton tablecloth for your dining table. Machine washable, stain-resistant finish. Perfect for everyday use and special occasions.',
        seoTitle: 'Premium Cotton Tablecloth | Home Textiles',
        seoDescription: 'Elegant cotton tablecloth, machine washable, stain-resistant.',
      },
      {
        locale: 'FR' as const,
        name: 'Nappe en Coton Premium',
        description: 'Élégante nappe en coton premium pour votre table. Lavable en machine, finition anti-taches.',
        seoTitle: 'Nappe en Coton Premium | Textiles Maison',
        seoDescription: 'Nappe élégante en coton, lavable en machine.',
      },
      {
        locale: 'AR' as const,
        name: 'مفرش طاولة قطني فاخر',
        description: 'مفرش طاولة قطني أنيق لطاولة الطعام. قابل للغسل في الغسالة، مقاوم للبقع.',
        seoTitle: 'مفرش طاولة قطني فاخر | مفروشات منزلية',
        seoDescription: 'مفرش طاولة قطني أنيق، قابل للغسل.',
      },
    ],
    media: [
      { mediaId: 'media-55555555-5555-5555-5555-555555555555', position: 0, isThumb: true },
    ],
    tags: ['tag-11111111-1111-1111-1111-111111111111', 'tag-33333333-3333-3333-3333-333333333333'],
    variants: [
      { variantKey: 'white-double', sku: 'CTB-WHITE-D', sizeId: 'size-77777777-7777-7777-7777-777777777777', colorId: 'col-22222222-2222-2222-2222-222222222222', stock: 20 },
      { variantKey: 'beige-double', sku: 'CTB-BEIGE-D', sizeId: 'size-77777777-7777-7777-7777-777777777777', colorId: 'col-66666666-6666-6666-6666-666666666666', stock: 15 },
    ],
  },
  {
    id: 'prod-55555555-5555-5555-5555-555555555555',
    slug: 'summer-breeze-dress',
    categoryId: 'cat-11111111-1111-1111-1111-111111111111',
    status: 'PUBLISHED' as const,
    basePriceMinor: 420000, // 4200.00 DZD
    isCustomizable: true,
    isMadeToOrder: false,
    isFeatured: true,
    featuredOrder: 5,
    salesCount: 55,
    wishlistCount: 110,
    reviewCount: 31,
    avgRating: 4.7,
    translations: [
      {
        locale: 'EN' as const,
        name: 'Summer Breeze Dress',
        description: 'Light and airy summer dress for hot days. Breathable cotton blend fabric, perfect for outdoor play and beach trips.',
        seoTitle: 'Summer Breeze Dress for Girls | Rime Couture',
        seoDescription: 'Light and airy summer dress, breathable cotton blend.',
      },
      {
        locale: 'FR' as const,
        name: 'Robe Brise d\'Été',
        description: 'Robe d\'été légère et aérienne pour les journées chaudes. Tissu en mélange de coton respirant.',
        seoTitle: 'Robe Brise d\'Été pour Filles | Rime Couture',
        seoDescription: 'Robe d\'été légère, mélange de coton respirant.',
      },
      {
        locale: 'AR' as const,
        name: 'فستان نسيم الصيف',
        description: 'فستان صيفي خفيف ومريح للأيام الحارة. قماش قطني مخلوط يسمح بمرور الهواء.',
        seoTitle: 'فستان نسيم الصيف للفتيات | ريم كوتور',
        seoDescription: 'فستان صيفي خفيف من القطن المخلوط.',
      },
    ],
    media: [
      { mediaId: 'media-33333333-3333-3333-3333-333333333333', position: 0, isThumb: true },
    ],
    tags: ['tag-11111111-1111-1111-1111-111111111111', 'tag-44444444-4444-4444-4444-444444444444', 'tag-99999999-9999-9999-9999-999999999999'],
    variants: [
      { variantKey: 'blue-2Y', sku: 'SBD-BLUE-2Y', sizeId: 'size-11111111-1111-1111-1111-111111111111', colorId: 'col-33333333-3333-3333-3333-333333333333', stock: 6 },
      { variantKey: 'blue-3Y', sku: 'SBD-BLUE-3Y', sizeId: 'size-22222222-2222-2222-2222-222222222222', colorId: 'col-33333333-3333-3333-3333-333333333333', stock: 8 },
      { variantKey: 'mint-2Y', sku: 'SBD-MINT-2Y', sizeId: 'size-11111111-1111-1111-1111-111111111111', colorId: 'col-88888888-8888-8888-8888-888888888888', stock: 5 },
      { variantKey: 'mint-3Y', sku: 'SBD-MINT-3Y', sizeId: 'size-22222222-2222-2222-2222-222222222222', colorId: 'col-88888888-8888-8888-8888-888888888888', stock: 7 },
    ],
  },
  {
    id: 'prod-66666666-6666-6666-6666-666666666666',
    slug: 'kitchen-apron-set',
    categoryId: 'cat-33333333-3333-3333-3333-333333333333',
    status: 'PUBLISHED' as const,
    basePriceMinor: 199900, // 1999.00 DZD
    isCustomizable: false,
    isMadeToOrder: false,
    isFeatured: false,
    salesCount: 78,
    wishlistCount: 65,
    reviewCount: 42,
    avgRating: 4.5,
    translations: [
      {
        locale: 'EN' as const,
        name: 'Kitchen Apron Set',
        description: 'Stylish kitchen apron set with matching pot holders. Durable cotton canvas, adjustable neck strap, deep pockets.',
        seoTitle: 'Kitchen Apron Set | Home Accessories',
        seoDescription: 'Stylish kitchen apron set with pot holders.',
      },
      {
        locale: 'FR' as const,
        name: 'Ensemble Tablier de Cuisine',
        description: 'Élégant ensemble tablier de cuisine avec maniques assorties. Toile de coton durable.',
        seoTitle: 'Ensemble Tablier de Cuisine | Accessoires Maison',
        seoDescription: 'Ensemble tablier de cuisine avec maniques.',
      },
      {
        locale: 'AR' as const,
        name: 'طقم مئزر مطبخ',
        description: 'طقم مئزر مطبخ أنيق مع قفازات حرارية متناسقة. قماش قطني متين.',
        seoTitle: 'طقم مئزر مطبخ | إكسسوارات المنزل',
        seoDescription: 'طقم مئزر مطبخ مع قفازات حرارية.',
      },
    ],
    media: [
      { mediaId: 'media-66666666-6666-6666-6666-666666666666', position: 0, isThumb: true },
    ],
    tags: ['tag-11111111-1111-1111-1111-111111111111'],
    variants: [
      { variantKey: 'red-onesize', sku: 'KAS-RED-OS', sizeId: 'size-88888888-8888-8888-8888-888888888888', colorId: 'col-44444444-4444-4444-4444-444444444444', stock: 25 },
      { variantKey: 'black-onesize', sku: 'KAS-BLACK-OS', sizeId: 'size-88888888-8888-8888-8888-888888888888', colorId: 'col-55555555-5555-5555-5555-555555555555', stock: 20 },
      { variantKey: 'beige-onesize', sku: 'KAS-BEIGE-OS', sizeId: 'size-88888888-8888-8888-8888-888888888888', colorId: 'col-66666666-6666-6666-6666-666666666666', stock: 18 },
    ],
  },
  {
    id: 'prod-77777777-7777-7777-7777-777777777777',
    slug: 'lace-trim-dress',
    categoryId: 'cat-11111111-1111-1111-1111-111111111111',
    status: 'PUBLISHED' as const,
    basePriceMinor: 550000, // 5500.00 DZD
    isCustomizable: true,
    isMadeToOrder: true,
    leadTimeDays: 10,
    isFeatured: false,
    salesCount: 22,
    wishlistCount: 75,
    reviewCount: 15,
    avgRating: 4.9,
    translations: [
      {
        locale: 'EN' as const,
        name: 'Lace Trim Princess Dress',
        description: 'Elegant princess dress with beautiful lace trim. Perfect for weddings, photoshoots, and special celebrations. Hand-finished with care.',
        seoTitle: 'Lace Trim Princess Dress | Special Occasions',
        seoDescription: 'Elegant princess dress with lace trim for special occasions.',
      },
      {
        locale: 'FR' as const,
        name: 'Robe Princesse à Dentelle',
        description: 'Élégante robe princesse avec belle bordure en dentelle. Parfaite pour mariages et célébrations.',
        seoTitle: 'Robe Princesse à Dentelle | Occasions Spéciales',
        seoDescription: 'Robe princesse élégante avec bordure en dentelle.',
      },
      {
        locale: 'AR' as const,
        name: 'فستان أميرة بحواف الدانتيل',
        description: 'فستان أميرة أنيق بحواف دانتيل جميلة. مثالي للأعراس وجلسات التصوير والاحتفالات الخاصة.',
        seoTitle: 'فستان أميرة بحواف الدانتيل | مناسبات خاصة',
        seoDescription: 'فستان أميرة أنيق بحواف الدانتيل.',
      },
    ],
    media: [
      { mediaId: 'media-77777777-7777-7777-7777-777777777777', position: 0, isThumb: true },
    ],
    tags: ['tag-22222222-2222-2222-2222-222222222222', 'tag-88888888-8888-8888-8888-888888888888'],
    variants: [
      { variantKey: 'white-4Y', sku: 'LTD-WHITE-4Y', sizeId: 'size-33333333-3333-3333-3333-333333333333', colorId: 'col-22222222-2222-2222-2222-222222222222', stock: 2 },
      { variantKey: 'white-5Y', sku: 'LTD-WHITE-5Y', sizeId: 'size-44444444-4444-4444-4444-444444444444', colorId: 'col-22222222-2222-2222-2222-222222222222', stock: 3 },
      { variantKey: 'pink-4Y', sku: 'LTD-PINK-4Y', sizeId: 'size-33333333-3333-3333-3333-333333333333', colorId: 'col-11111111-1111-1111-1111-111111111111', stock: 2 },
    ],
  },
  {
    id: 'prod-88888888-8888-8888-8888-888888888888',
    slug: 'linen-bedsheet-set',
    categoryId: 'cat-22222222-2222-2222-2222-222222222222',
    status: 'PUBLISHED' as const,
    basePriceMinor: 899900, // 8999.00 DZD
    isCustomizable: false,
    isMadeToOrder: false,
    isFeatured: false,
    salesCount: 35,
    wishlistCount: 90,
    reviewCount: 28,
    avgRating: 4.8,
    translations: [
      {
        locale: 'EN' as const,
        name: 'Premium Linen Bedsheet Set',
        description: 'Luxurious 100% French linen bedsheet set. Includes fitted sheet, flat sheet, and 2 pillowcases. Gets softer with every wash.',
        seoTitle: 'Premium Linen Bedsheet Set | Luxury Bedding',
        seoDescription: '100% French linen bedsheet set, gets softer with every wash.',
      },
      {
        locale: 'FR' as const,
        name: 'Parure de Draps en Lin Premium',
        description: 'Parure de draps en lin français 100% luxueux. Comprend drap housse, drap plat et 2 taies.',
        seoTitle: 'Parure de Draps en Lin Premium | Literie de Luxe',
        seoDescription: 'Parure de draps en lin français 100%.',
      },
      {
        locale: 'AR' as const,
        name: 'طقم ملاءات كتان فاخر',
        description: 'طقم ملاءات من الكتان الفرنسي الفاخر 100٪. يشمل ملاءة مطاطية وملاءة مسطحة و2 أغطية وسائد.',
        seoTitle: 'طقم ملاءات كتان فاخر | فراش فاخر',
        seoDescription: 'طقم ملاءات من الكتان الفرنسي 100٪.',
      },
    ],
    media: [
      { mediaId: 'media-88888888-8888-8888-8888-888888888888', position: 0, isThumb: true },
    ],
    tags: ['tag-33333333-3333-3333-3333-333333333333'],
    variants: [
      { variantKey: 'white-single', sku: 'LBS-WHITE-S', sizeId: 'size-66666666-6666-6666-6666-666666666666', colorId: 'col-22222222-2222-2222-2222-222222222222', stock: 8 },
      { variantKey: 'white-double', sku: 'LBS-WHITE-D', sizeId: 'size-77777777-7777-7777-7777-777777777777', colorId: 'col-22222222-2222-2222-2222-222222222222', stock: 6 },
      { variantKey: 'beige-single', sku: 'LBS-BEIGE-S', sizeId: 'size-66666666-6666-6666-6666-666666666666', colorId: 'col-66666666-6666-6666-6666-666666666666', stock: 5 },
      { variantKey: 'beige-double', sku: 'LBS-BEIGE-D', sizeId: 'size-77777777-7777-7777-7777-777777777777', colorId: 'col-66666666-6666-6666-6666-666666666666', stock: 4 },
    ],
  },
];

// ============================================================================
// ORDERS
// ============================================================================
export const mockOrders = [
  {
    id: 'order-11111111-1111-1111-1111-111111111111',
    orderNumber: 'RC-2024-0001',
    userId: '22222222-2222-2222-2222-222222222222',
    status: 'DELIVERED' as const,
    paymentStatus: 'SUCCESS' as const,
    subtotalMinor: 759800,
    shippingMinor: 50000,
    totalMinor: 809800,
    customerName: 'Fatima Benali',
    customerPhone: '+213555123456',
    customerEmail: 'fatima.benali@gmail.com',
    addressLine1: '45 Rue Didouche Mourad',
    wilayaCode: 16,
    wilayaName: 'Alger',
    commune: 'Alger Centre',
    postalCode: '16000',
    confirmedAt: new Date('2024-10-15'),
    shippedAt: new Date('2024-10-16'),
    deliveredAt: new Date('2024-10-18'),
    items: [
      {
        productId: 'prod-11111111-1111-1111-1111-111111111111',
        variantId: null,
        quantity: 1,
        unitPriceMinor: 459900,
        productName: 'Floral Cotton Dress',
        productSlug: 'floral-cotton-dress',
        sizeLabel: '3 Years',
        colorLabel: 'Pink',
      },
      {
        productId: 'prod-22222222-2222-2222-2222-222222222222',
        variantId: null,
        quantity: 1,
        unitPriceMinor: 299900,
        productName: 'Silk Pillowcase Set',
        productSlug: 'silk-pillowcase-set',
        sizeLabel: 'Single',
        colorLabel: 'White',
      },
    ],
  },
  {
    id: 'order-22222222-2222-2222-2222-222222222222',
    orderNumber: 'RC-2024-0002',
    userId: '33333333-3333-3333-3333-333333333333',
    status: 'SHIPPED' as const,
    paymentStatus: 'SUCCESS' as const,
    subtotalMinor: 650000,
    shippingMinor: 60000,
    totalMinor: 710000,
    customerName: 'Sarah Hadj',
    customerPhone: '+213661234567',
    customerEmail: 'sarah.hadj@outlook.com',
    addressLine1: '12 Boulevard Colonel Amirouche',
    wilayaCode: 31,
    wilayaName: 'Oran',
    commune: 'Oran',
    postalCode: '31000',
    confirmedAt: new Date('2024-11-20'),
    shippedAt: new Date('2024-11-21'),
    items: [
      {
        productId: 'prod-33333333-3333-3333-3333-333333333333',
        variantId: null,
        quantity: 1,
        unitPriceMinor: 650000,
        productName: 'Pastel Party Dress',
        productSlug: 'pastel-party-dress',
        sizeLabel: '4 Years',
        colorLabel: 'Lavender',
      },
    ],
  },
  {
    id: 'order-33333333-3333-3333-3333-333333333333',
    orderNumber: 'RC-2024-0003',
    userId: '44444444-4444-4444-4444-444444444444',
    status: 'CONFIRMED' as const,
    paymentStatus: 'SUCCESS' as const,
    subtotalMinor: 1299800,
    shippingMinor: 50000,
    totalMinor: 1349800,
    customerName: 'Amina Kaci',
    customerPhone: '+213770987654',
    customerEmail: 'amina.kaci@yahoo.fr',
    addressLine1: '8 Rue Ben M\'hidi',
    wilayaCode: 25,
    wilayaName: 'Constantine',
    commune: 'Constantine',
    postalCode: '25000',
    confirmedAt: new Date('2024-12-01'),
    items: [
      {
        productId: 'prod-88888888-8888-8888-8888-888888888888',
        variantId: null,
        quantity: 1,
        unitPriceMinor: 899900,
        productName: 'Premium Linen Bedsheet Set',
        productSlug: 'linen-bedsheet-set',
        sizeLabel: 'Double',
        colorLabel: 'White',
      },
      {
        productId: 'prod-44444444-4444-4444-4444-444444444444',
        variantId: null,
        quantity: 1,
        unitPriceMinor: 399900,
        productName: 'Premium Cotton Tablecloth',
        productSlug: 'cotton-tablecloth',
        sizeLabel: 'Double',
        colorLabel: 'Beige',
      },
    ],
  },
];

// ============================================================================
// REVIEWS
// ============================================================================
export const mockReviews = [
  {
    id: 'review-11111111-1111-1111-1111-111111111111',
    productId: 'prod-11111111-1111-1111-1111-111111111111',
    userId: '22222222-2222-2222-2222-222222222222',
    rating: 5,
    title: 'Absolutely beautiful!',
    comment: 'The dress is even more beautiful in person. The cotton is so soft and the floral pattern is gorgeous. My daughter loves it! Perfect for summer.',
  },
  {
    id: 'review-22222222-2222-2222-2222-222222222222',
    productId: 'prod-11111111-1111-1111-1111-111111111111',
    userId: '33333333-3333-3333-3333-333333333333',
    rating: 5,
    title: 'Excellent quality',
    comment: 'Hand-sewn with so much care. The stitching is impeccable. Will definitely order more dresses from Rime Couture.',
  },
  {
    id: 'review-33333333-3333-3333-3333-333333333333',
    productId: 'prod-22222222-2222-2222-2222-222222222222',
    userId: '44444444-4444-4444-4444-444444444444',
    rating: 5,
    title: 'Best pillowcases ever',
    comment: 'The silk quality is amazing. My hair and skin feel so much better. Worth every dinar!',
  },
  {
    id: 'review-44444444-4444-4444-4444-444444444444',
    productId: 'prod-33333333-3333-3333-3333-333333333333',
    userId: '22222222-2222-2222-2222-222222222222',
    rating: 5,
    title: 'Perfect for my daughter\'s birthday',
    comment: 'The pastel party dress was the star of the show. Everyone asked where I got it. Beautiful lace details!',
  },
  {
    id: 'review-55555555-5555-5555-5555-555555555555',
    productId: 'prod-44444444-4444-4444-4444-444444444444',
    userId: '33333333-3333-3333-3333-333333333333',
    rating: 4,
    title: 'Great tablecloth',
    comment: 'Nice quality cotton, washes well. Slightly smaller than expected but still covers our table nicely.',
  },
  {
    id: 'review-66666666-6666-6666-6666-666666666666',
    productId: 'prod-55555555-5555-5555-5555-555555555555',
    userId: '44444444-4444-4444-4444-444444444444',
    rating: 5,
    title: 'Perfect summer dress',
    comment: 'So light and comfortable! My daughter wears it almost every day. The mint green color is beautiful.',
  },
  {
    id: 'review-77777777-7777-7777-7777-777777777777',
    productId: 'prod-66666666-6666-6666-6666-666666666666',
    userId: '22222222-2222-2222-2222-222222222222',
    rating: 4,
    title: 'Good apron set',
    comment: 'Practical and stylish. The pot holders are a nice bonus. Deep pockets are very useful.',
  },
  {
    id: 'review-88888888-8888-8888-8888-888888888888',
    productId: 'prod-88888888-8888-8888-8888-888888888888',
    userId: '44444444-4444-4444-4444-444444444444',
    rating: 5,
    title: 'Luxury linen',
    comment: 'The French linen is incredible quality. Gets softer with each wash just like they said. Best bedsheets I\'ve ever owned.',
  },
];

// ============================================================================
// WISHLISTS
// ============================================================================
export const mockWishlists = [
  { userId: '22222222-2222-2222-2222-222222222222', productId: 'prod-33333333-3333-3333-3333-333333333333' },
  { userId: '22222222-2222-2222-2222-222222222222', productId: 'prod-77777777-7777-7777-7777-777777777777' },
  { userId: '33333333-3333-3333-3333-333333333333', productId: 'prod-55555555-5555-5555-5555-555555555555' },
  { userId: '33333333-3333-3333-3333-333333333333', productId: 'prod-88888888-8888-8888-8888-888888888888' },
  { userId: '44444444-4444-4444-4444-444444444444', productId: 'prod-11111111-1111-1111-1111-111111111111' },
  { userId: '44444444-4444-4444-4444-444444444444', productId: 'prod-22222222-2222-2222-2222-222222222222' },
  { userId: '55555555-5555-5555-5555-555555555555', productId: 'prod-33333333-3333-3333-3333-333333333333' },
];

// ============================================================================
// CARTS
// ============================================================================
export const mockCarts = [
  {
    id: 'cart-11111111-1111-1111-1111-111111111111',
    userId: '55555555-5555-5555-5555-555555555555',
    items: [
      {
        productId: 'prod-55555555-5555-5555-5555-555555555555',
        quantity: 1,
        unitPriceMinor: 420000,
      },
      {
        productId: 'prod-66666666-6666-6666-6666-666666666666',
        quantity: 2,
        unitPriceMinor: 199900,
      },
    ],
  },
];

// ============================================================================
// CMS PAGES
// ============================================================================
export const mockCmsPages = [
  {
    id: 'cms-11111111-1111-1111-1111-111111111111',
    slug: 'about-us',
    isPublished: true,
    translations: [
      {
        locale: 'EN' as const,
        title: 'About Us',
        body: 'Rime Couture is a family-owned Algerian business specializing in hand-sewn children\'s clothing and premium home textiles. Founded with a passion for quality craftsmanship and natural materials.',
        seoTitle: 'About Rime Couture | Handmade Kids Clothing',
        seoDescription: 'Learn about Rime Couture, Algeria\'s premium handmade children\'s clothing and home textiles brand.',
      },
      {
        locale: 'FR' as const,
        title: 'À Propos',
        body: 'Rime Couture est une entreprise familiale algérienne spécialisée dans les vêtements pour enfants cousus main et les textiles de maison premium.',
        seoTitle: 'À Propos de Rime Couture | Vêtements Enfants Faits Main',
        seoDescription: 'Découvrez Rime Couture, la marque algérienne de vêtements pour enfants et textiles de maison faits main.',
      },
      {
        locale: 'AR' as const,
        title: 'من نحن',
        body: 'ريم كوتور هي شركة عائلية جزائرية متخصصة في ملابس الأطفال المخيطة يدوياً والمفروشات المنزلية الفاخرة.',
        seoTitle: 'عن ريم كوتور | ملابس أطفال مصنوعة يدوياً',
        seoDescription: 'تعرف على ريم كوتور، العلامة الجزائرية للملابس الأطفال والمفروشات المنزلية المصنوعة يدوياً.',
      },
    ],
  },
  {
    id: 'cms-22222222-2222-2222-2222-222222222222',
    slug: 'shipping-policy',
    isPublished: true,
    translations: [
      {
        locale: 'EN' as const,
        title: 'Shipping Policy',
        body: 'We ship to all 58 wilayas in Algeria. Standard shipping takes 3-5 business days. Express shipping available for major cities.',
        seoTitle: 'Shipping Policy | Rime Couture',
        seoDescription: 'Learn about our shipping options across Algeria.',
      },
      {
        locale: 'FR' as const,
        title: 'Politique de Livraison',
        body: 'Nous livrons dans les 58 wilayas d\'Algérie. La livraison standard prend 3-5 jours ouvrables.',
        seoTitle: 'Politique de Livraison | Rime Couture',
        seoDescription: 'Découvrez nos options de livraison en Algérie.',
      },
      {
        locale: 'AR' as const,
        title: 'سياسة الشحن',
        body: 'نقوم بالشحن إلى جميع الولايات الـ 58 في الجزائر. الشحن العادي يستغرق 3-5 أيام عمل.',
        seoTitle: 'سياسة الشحن | ريم كوتور',
        seoDescription: 'تعرف على خيارات الشحن عبر الجزائر.',
      },
    ],
  },
  {
    id: 'cms-33333333-3333-3333-3333-333333333333',
    slug: 'return-policy',
    isPublished: true,
    translations: [
      {
        locale: 'EN' as const,
        title: 'Return Policy',
        body: 'We accept returns within 14 days of delivery for unused items in original packaging. Made-to-order items are non-refundable.',
        seoTitle: 'Return Policy | Rime Couture',
        seoDescription: 'Our return and refund policy for all purchases.',
      },
      {
        locale: 'FR' as const,
        title: 'Politique de Retour',
        body: 'Nous acceptons les retours dans les 14 jours suivant la livraison pour les articles non utilisés.',
        seoTitle: 'Politique de Retour | Rime Couture',
        seoDescription: 'Notre politique de retour et de remboursement.',
      },
      {
        locale: 'AR' as const,
        title: 'سياسة الإرجاع',
        body: 'نقبل الإرجاع خلال 14 يوماً من التسليم للمنتجات غير المستخدمة في عبوتها الأصلية.',
        seoTitle: 'سياسة الإرجاع | ريم كوتور',
        seoDescription: 'سياسة الإرجاع والاسترداد لجميع المشتريات.',
      },
    ],
  },
];

// ============================================================================
// ANALYTICS EVENTS (Sample)
// ============================================================================
export const mockAnalyticsEvents = [
  {
    type: 'PAGE_VIEW' as const,
    sessionId: 'session-001',
    path: '/',
    referrer: 'https://google.com',
  },
  {
    type: 'VIEW_PRODUCT' as const,
    sessionId: 'session-001',
    productId: 'prod-11111111-1111-1111-1111-111111111111',
    path: '/products/floral-cotton-dress',
  },
  {
    type: 'CART_ADD' as const,
    sessionId: 'session-001',
    productId: 'prod-11111111-1111-1111-1111-111111111111',
  },
  {
    type: 'PURCHASE' as const,
    sessionId: 'session-001',
    orderId: 'order-11111111-1111-1111-1111-111111111111',
    meta: { totalMinor: 809800 },
  },
  {
    type: 'SEARCH' as const,
    sessionId: 'session-002',
    meta: { query: 'pink dress', resultsCount: 3 },
  },
];
