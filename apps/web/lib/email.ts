/**
 * Email service using nodemailer + Gmail SMTP
 * Sends OTP codes, order receipts, product notifications, shipping updates
 */
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const MAIL_FROM = process.env.MAIL_FROM || 'Rimoucha <noreply@rimoucha.com>';

/**
 * Send a 5-digit OTP code via email
 */
export async function sendOtpEmail(
  to: string,
  code: string,
  purpose: 'SIGNUP' | 'RESET',
): Promise<void> {
  const isSignup = purpose === 'SIGNUP';
  const subject = isSignup
    ? 'Rimoucha - Verify your email'
    : 'Rimoucha - Reset your password';

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#fff0ed;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(255,77,129,0.12);">
    <tr><td style="background:linear-gradient(135deg,#ff4d81,#ff7ea5);padding:32px 24px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:28px;font-family:'Pacifico',cursive;">Rimoucha</h1>
    </td></tr>
    <tr><td style="padding:32px 24px;text-align:center;">
      <h2 style="margin:0 0 8px;color:#111;font-size:20px;">
        ${isSignup ? 'Verify your email' : 'Reset your password'}
      </h2>
      <p style="margin:0 0 24px;color:#6b6b67;font-size:15px;line-height:1.5;">
        ${isSignup
          ? 'Enter this code to complete your registration:'
          : 'Enter this code to reset your password:'}
      </p>
      <div style="display:inline-block;padding:16px 40px;background:#fff0ed;border-radius:12px;border:2px dashed #ff4d81;">
        <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#ff4d81;">${code}</span>
      </div>
      <p style="margin:20px 0 0;color:#6b6b67;font-size:13px;">
        This code expires in <strong>10 minutes</strong>.<br/>
        If you didn't request this, you can safely ignore this email.
      </p>
    </td></tr>
    <tr><td style="padding:16px 24px;text-align:center;border-top:1px solid #f0e8e5;">
      <p style="margin:0;color:#cfc5bf;font-size:12px;">© ${new Date().getFullYear()} Rimoucha. Made with ♥ in Algeria</p>
    </td></tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: MAIL_FROM,
    to,
    subject,
    html,
  });
}

// ============================================================================
// SHARED EMAIL WRAPPER
// ============================================================================

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://rimoucha.com';

function emailWrapper(title: string, body: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#fff0ed;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(255,77,129,0.12);">
  <tr><td style="background:linear-gradient(135deg,#ff4d81,#ff7ea5);padding:28px 24px;text-align:center;">
    <h1 style="margin:0;color:#fff;font-size:28px;font-family:'Pacifico',cursive;letter-spacing:1px;">Rimoucha</h1>
    <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:12px;letter-spacing:2px;text-transform:uppercase;">Handmade with Love</p>
  </td></tr>
  <tr><td style="padding:0;">
    <div style="text-align:center;padding:24px 24px 0;">
      <h2 style="margin:0 0 16px;color:#1a1a1a;font-size:22px;font-weight:700;">${title}</h2>
    </div>
    ${body}
  </td></tr>
  <tr><td style="padding:20px 24px;text-align:center;border-top:1px solid #f0e8e5;background:#fef7f5;">
    <p style="margin:0 0 4px;color:#cfc5bf;font-size:12px;">© ${new Date().getFullYear()} Rimoucha. Made with ♥ in Bouira, Algeria</p>
    <a href="${SITE_URL}" style="color:#ff4d81;font-size:12px;text-decoration:none;">rimoucha.com</a>
  </td></tr>
</table>
</body></html>`;
}

// ============================================================================
// ORDER RECEIPT EMAIL
// ============================================================================

interface OrderItemEmail {
  productName: string;
  productSlug: string;
  productImageUrl?: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  sizeLabel?: string | null;
  colorLabel?: string | null;
}

interface OrderReceiptData {
  orderNumber: string;
  customerName: string;
  items: OrderItemEmail[];
  subtotal: number;
  shipping: number;
  total: number;
  wilayaName: string;
  commune: string;
  address?: string | null;
}

export async function sendOrderReceiptEmail(to: string, data: OrderReceiptData): Promise<void> {
  const formatPrice = (v: number) => v.toLocaleString('fr-DZ', { maximumFractionDigits: 0 });

  const itemRows = data.items.map(item => `
    <tr>
      <td style="padding:12px 8px;border-bottom:1px solid #f5ede8;">
        <div style="display:flex;align-items:center;gap:12px;">
          ${item.productImageUrl ? `<img src="${item.productImageUrl}" alt="${item.productName}" style="width:56px;height:56px;border-radius:8px;object-fit:cover;"/>` : ''}
          <div>
            <a href="${SITE_URL}/product/${item.productSlug}" style="color:#1a1a1a;text-decoration:none;font-weight:600;font-size:14px;">${item.productName}</a>
            ${item.sizeLabel || item.colorLabel ? `<p style="margin:2px 0 0;color:#999;font-size:12px;">${[item.sizeLabel, item.colorLabel].filter(Boolean).join(' • ')}</p>` : ''}
          </div>
        </div>
      </td>
      <td style="padding:12px 8px;border-bottom:1px solid #f5ede8;text-align:center;color:#666;font-size:14px;">×${item.quantity}</td>
      <td style="padding:12px 8px;border-bottom:1px solid #f5ede8;text-align:right;font-weight:600;font-size:14px;color:#1a1a1a;">${formatPrice(item.lineTotal)} DZD</td>
    </tr>
  `).join('');

  const body = `
    <div style="padding:0 24px 8px;text-align:center;">
      <div style="font-size:48px;margin-bottom:8px;">🎉</div>
      <p style="margin:0 0 20px;color:#666;font-size:15px;line-height:1.6;">
        Thank you for your order, <strong>${data.customerName}</strong>!<br/>
        Your order <strong style="color:#ff4d81;">#${data.orderNumber}</strong> has been placed successfully.
      </p>
    </div>
    <div style="padding:0 24px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0e8e5;border-radius:12px;overflow:hidden;">
        <thead><tr style="background:#fef7f5;">
          <th style="padding:10px 8px;text-align:left;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;">Product</th>
          <th style="padding:10px 8px;text-align:center;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;">Qty</th>
          <th style="padding:10px 8px;text-align:right;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;">Total</th>
        </tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
        <tr><td style="padding:4px 0;color:#666;font-size:14px;">Subtotal</td><td style="padding:4px 0;text-align:right;color:#666;font-size:14px;">${formatPrice(data.subtotal)} DZD</td></tr>
        <tr><td style="padding:4px 0;color:#666;font-size:14px;">Shipping</td><td style="padding:4px 0;text-align:right;color:#666;font-size:14px;">${formatPrice(data.shipping)} DZD</td></tr>
        <tr><td style="padding:8px 0 0;color:#1a1a1a;font-size:18px;font-weight:700;border-top:2px solid #f0e8e5;">Total</td><td style="padding:8px 0 0;text-align:right;color:#ff4d81;font-size:18px;font-weight:700;border-top:2px solid #f0e8e5;">${formatPrice(data.total)} DZD</td></tr>
      </table>
      <div style="margin-top:20px;padding:16px;background:#fef7f5;border-radius:12px;">
        <p style="margin:0 0 4px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;">📍 Delivery to</p>
        <p style="margin:0;color:#1a1a1a;font-size:14px;font-weight:600;">${data.commune}, ${data.wilayaName}</p>
        ${data.address ? `<p style="margin:4px 0 0;color:#666;font-size:13px;">${data.address}</p>` : ''}
      </div>
      <div style="text-align:center;margin-top:24px;">
        <a href="${SITE_URL}/orders" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#ff4d81,#ff7ea5);color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">Track Your Order</a>
      </div>
    </div>`;

  await transporter.sendMail({
    from: MAIL_FROM,
    to,
    subject: `Rimoucha - Order #${data.orderNumber} Confirmed 🎉`,
    html: emailWrapper('Order Confirmed!', body),
  });
}

// ============================================================================
// NEW PRODUCT NOTIFICATION EMAIL
// ============================================================================

interface NewProductEmailData {
  productName: string;
  productSlug: string;
  productImageUrl?: string;
  productPrice: number;
  productDescription?: string;
}

export async function sendNewProductEmail(to: string, data: NewProductEmailData): Promise<void> {
  const formatPrice = (v: number) => v.toLocaleString('fr-DZ', { maximumFractionDigits: 0 });

  const body = `
    <div style="padding:0 24px 24px;text-align:center;">
      <div style="font-size:48px;margin-bottom:8px;">✨</div>
      <p style="margin:0 0 20px;color:#666;font-size:15px;line-height:1.6;">
        A brand new product just dropped! Be the first to check it out.
      </p>
      ${data.productImageUrl ? `
      <div style="margin:0 auto 20px;max-width:320px;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
        <img src="${data.productImageUrl}" alt="${data.productName}" style="width:100%;height:auto;display:block;"/>
      </div>` : ''}
      <h3 style="margin:0 0 8px;color:#1a1a1a;font-size:20px;font-weight:700;">${data.productName}</h3>
      <p style="margin:0 0 16px;color:#ff4d81;font-size:22px;font-weight:700;">${formatPrice(data.productPrice)} DZD</p>
      ${data.productDescription ? `<p style="margin:0 0 20px;color:#999;font-size:14px;line-height:1.5;">${data.productDescription.substring(0, 120)}${data.productDescription.length > 120 ? '...' : ''}</p>` : ''}
      <a href="${SITE_URL}/product/${data.productSlug}" style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#ff4d81,#ff7ea5);color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">Shop Now →</a>
    </div>`;

  await transporter.sendMail({
    from: MAIL_FROM,
    to,
    subject: `Rimoucha - New Arrival: ${data.productName} ✨`,
    html: emailWrapper('New Product Alert!', body),
  });
}

// ============================================================================
// DISCOUNT NOTIFICATION EMAIL
// ============================================================================

interface DiscountEmailData {
  productName: string;
  productSlug: string;
  productImageUrl?: string;
  originalPrice: number;
  newPrice: number;
  discountPercent: number;
}

export async function sendDiscountEmail(to: string, data: DiscountEmailData): Promise<void> {
  const formatPrice = (v: number) => v.toLocaleString('fr-DZ', { maximumFractionDigits: 0 });

  const body = `
    <div style="padding:0 24px 24px;text-align:center;">
      <div style="font-size:48px;margin-bottom:4px;">🔥</div>
      <div style="display:inline-block;padding:6px 20px;background:linear-gradient(135deg,#EF4444,#DC2626);color:#fff;border-radius:20px;font-weight:700;font-size:18px;margin-bottom:16px;">
        Save ${data.discountPercent}%
      </div>
      <p style="margin:12px 0 20px;color:#666;font-size:15px;line-height:1.6;">
        Great news! <strong>${data.productName}</strong> now has an amazing discount.<br/>
        Hurry before stock runs out!
      </p>
      ${data.productImageUrl ? `
      <div style="margin:0 auto 20px;max-width:280px;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);position:relative;">
        <img src="${data.productImageUrl}" alt="${data.productName}" style="width:100%;height:auto;display:block;"/>
        <div style="position:absolute;top:12px;left:12px;background:linear-gradient(135deg,#EF4444,#DC2626);color:#fff;padding:4px 12px;border-radius:6px;font-size:13px;font-weight:700;">-${data.discountPercent}%</div>
      </div>` : ''}
      <p style="margin:0 0 4px;">
        <span style="color:#999;font-size:16px;text-decoration:line-through;">${formatPrice(data.originalPrice)} DZD</span>
      </p>
      <p style="margin:0 0 20px;color:#EF4444;font-size:26px;font-weight:700;">${formatPrice(data.newPrice)} DZD</p>
      <a href="${SITE_URL}/product/${data.productSlug}" style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#EF4444,#DC2626);color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">Grab the Deal →</a>
    </div>`;

  await transporter.sendMail({
    from: MAIL_FROM,
    to,
    subject: `Rimoucha - ${data.discountPercent}% OFF on ${data.productName} 🔥`,
    html: emailWrapper('Flash Sale!', body),
  });
}

// ============================================================================
// ORDER SHIPPED EMAIL
// ============================================================================

interface OrderShippedData {
  orderNumber: string;
  customerName: string;
  trackingCode?: string | null;
}

export async function sendOrderShippedEmail(to: string, data: OrderShippedData): Promise<void> {
  const body = `
    <div style="padding:0 24px 24px;text-align:center;">
      <div style="font-size:48px;margin-bottom:8px;">🚚</div>
      <p style="margin:0 0 20px;color:#666;font-size:15px;line-height:1.6;">
        Great news, <strong>${data.customerName}</strong>!<br/>
        Your order <strong style="color:#ff4d81;">#${data.orderNumber}</strong> is on its way to you!
      </p>
      ${data.trackingCode ? `
      <div style="display:inline-block;padding:16px 32px;background:#fef7f5;border-radius:12px;border:2px dashed #ff4d81;margin-bottom:20px;">
        <p style="margin:0 0 4px;color:#999;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Tracking Code</p>
        <span style="font-size:20px;font-weight:700;color:#ff4d81;letter-spacing:2px;">${data.trackingCode}</span>
      </div>` : ''}
      <p style="margin:16px 0 24px;color:#999;font-size:14px;">
        You'll receive your package soon. We hope you love it! 💕
      </p>
      <a href="${SITE_URL}/orders" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#ff4d81,#ff7ea5);color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">Track Your Order</a>
    </div>`;

  await transporter.sendMail({
    from: MAIL_FROM,
    to,
    subject: `Rimoucha - Order #${data.orderNumber} Shipped! 🚚`,
    html: emailWrapper('Your Order is on the Way!', body),
  });
}

// ============================================================================
// BULK EMAIL HELPER (for new product / discount notifications)
// ============================================================================

export async function sendBulkEmails(
  recipients: string[],
  sendFn: (to: string) => Promise<void>,
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;
  // Send in batches of 5 to avoid SMTP rate limits
  for (let i = 0; i < recipients.length; i += 5) {
    const batch = recipients.slice(i, i + 5);
    const results = await Promise.allSettled(batch.map(email => sendFn(email)));
    for (const r of results) {
      if (r.status === 'fulfilled') sent++;
      else failed++;
    }
    // Small delay between batches
    if (i + 5 < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return { sent, failed };
}
