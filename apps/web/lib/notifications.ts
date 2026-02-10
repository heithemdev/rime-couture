import nodemailer from 'nodemailer';
import { prisma } from '@repo/db';

// ============================================================================
// CONFIGURATION
// ============================================================================

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM_EMAIL = process.env.MAIL_FROM || 'Rimoucha <heithem1980@gmail.com>';

// ============================================================================
// TYPES (Fixes the "Unexpected any" error)
// ============================================================================

interface ProductNotificationData {
  name: string;
  slug: string;
  basePriceMinor: number;
  originalPriceMinor: number | null;
  discountPercent: number | null;
  imageUrl: string | null;
}

// ============================================================================
// TEMPLATES
// ============================================================================

const getBaseStyles = () => `
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  background-color: #ffffff;
  color: #333333;
  line-height: 1.6;
`;

const generateProductEmailHtml = (product: ProductNotificationData, type: 'NEW' | 'DISCOUNT') => {
  const isDiscount = type === 'DISCOUNT';
  const title = isDiscount ? 'Price Drop Alert! 🏷️' : 'New Arrival ✨';
  const subtitle = isDiscount 
    ? `Great news! <strong>${product.name}</strong> is now on sale.` 
    : `Check out the latest addition to our collection: <strong>${product.name}</strong>.`;
  
  const priceDisplay = isDiscount 
    ? `<span style="text-decoration: line-through; color: #999; margin-right: 10px;">${(product.originalPriceMinor! / 100).toLocaleString()} DA</span>
       <span style="color: #be185d; font-size: 24px; font-weight: bold;">${(product.basePriceMinor / 100).toLocaleString()} DA</span>`
    : `<span style="color: #333; font-size: 24px; font-weight: bold;">${(product.basePriceMinor / 100).toLocaleString()} DA</span>`;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const ctaLink = `${appUrl}/product/${product.slug}`;
  
  // Ensure we have a valid absolute URL for the image
  let imageUrl = '';
  if (product.imageUrl) {
    imageUrl = product.imageUrl.startsWith('http') 
      ? product.imageUrl 
      : `${appUrl}${product.imageUrl}`;
  }

  return `
    <!DOCTYPE html>
    <html>
      <body style="margin: 0; padding: 20px; background-color: #f4f4f5;">
        <div style="${getBaseStyles()} padding: 0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div style="background-color: #be185d; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; letter-spacing: 1px;">RIME COUTURE</h1>
          </div>
          
          ${imageUrl ? `<div style="width: 100%; height: 300px; background-image: url('${imageUrl}'); background-size: cover; background-position: center;"></div>` : ''}
          
          <div style="padding: 32px 24px; text-align: center;">
            <h2 style="margin-top: 0; color: #111; font-size: 28px;">${title}</h2>
            <p style="font-size: 16px; color: #555; margin-bottom: 24px;">${subtitle}</p>
            
            <div style="margin-bottom: 32px;">
              ${priceDisplay}
              ${isDiscount && product.discountPercent ? `<br><span style="display: inline-block; background: #ffe4e6; color: #be185d; padding: 4px 12px; border-radius: 99px; font-size: 14px; font-weight: bold; margin-top: 8px;">-${product.discountPercent}% OFF</span>` : ''}
            </div>

            <a href="${ctaLink}" style="display: inline-block; background-color: #111; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Shop Now
            </a>
          </div>

          <div style="background-color: #fafafa; padding: 20px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee;">
            <p>You received this email because you are a valued customer of Rime Couture.</p>
            <p><a href="${appUrl}" style="color: #be185d; text-decoration: none;">Visit Website</a></p>
          </div>
        </div>
      </body>
    </html>
  `;
};

// ============================================================================
// SENDING LOGIC
// ============================================================================

export async function broadcastProductNotification(productId: string, type: 'NEW' | 'DISCOUNT') {
  try {
    // 1. Fetch full product details including first image
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        translations: { where: { locale: 'EN' } }, // Fallback name
        media: { 
          where: { isThumb: true },
          take: 1,
          include: { media: true }
        }
      }
    });

    if (!product || !product.isActive) return;

    // Normalize data for template
    const productData: ProductNotificationData = {
      name: product.translations[0]?.name || product.slug,
      slug: product.slug,
      basePriceMinor: product.basePriceMinor,
      originalPriceMinor: product.originalPriceMinor,
      discountPercent: product.discountPercent,
      imageUrl: product.media[0]?.media?.url || null
    };

    // 2. Fetch all subscribed clients
    // NOTE: Sending to all users with role CLIENT. 
    // In production, you might want to filter by "newsletter_subscribed" boolean if you add one.
    const users = await prisma.user.findMany({
      where: { 
        role: 'CLIENT',
        email: { not: undefined } 
      },
      select: { email: true }
    });

    if (users.length === 0) {
      console.log('[Notification] No users to email.');
      return;
    }

    const emailHtml = generateProductEmailHtml(productData, type);
    const subject = type === 'DISCOUNT' 
      ? `Sale Alert: ${productData.name} is now ${productData.discountPercent}% OFF!` 
      : `New Arrival: Discover ${productData.name}`;

    console.log(`[Notification] Sending ${type} emails to ${users.length} users...`);

    // 3. Send Emails via Nodemailer
    // We map over users and send individual emails. 
    const sendPromises = users.map(user => {
      return transporter.sendMail({
        from: FROM_EMAIL,
        to: user.email,
        subject: subject,
        html: emailHtml,
      });
    });

    // Wait for all to process (Promise.allSettled prevents one failure from stopping others)
    const results = await Promise.allSettled(sendPromises);
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    console.log(`[Notification] Successfully sent ${successCount}/${users.length} emails.`);

  } catch (error) {
    console.error('[Notification Error]', error);
  }
}