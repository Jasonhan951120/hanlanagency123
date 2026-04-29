import { Resend } from 'resend';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const resend = new Resend(process.env.RESEND_API_KEY);

// Simple In-Memory Rate Limiter (Per Vercel Instance)
// Key: IP Address, Value: Array of request timestamps
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 3;

// XSS Sanitization Function
const sanitize = (str: string) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(200).json({ success: false }); // Obscured method error
  }

  // 1. IP Rate Limiting
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  
  let timestamps = rateLimitMap.get(ip) || [];
  // Filter timestamps within the current window
  timestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
  
  if (timestamps.length >= MAX_REQUESTS) {
    // Silently drop - return success without sending
    console.warn(`Rate limit exceeded for IP: ${ip}`);
    return res.status(200).json({ success: true, message: "Enquiry received." });
  }
  
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);

  // 2. Extract Data
  const { name, email, company, reason, _honey } = req.body;

  // 3. Honeypot Check (Bot blocking)
  if (_honey) {
    // Silently drop
    console.warn(`Honeypot triggered from IP: ${ip}`);
    return res.status(200).json({ success: true, message: "Enquiry received." });
  }

  // 4. Basic Validation
  if (!name || !email || !reason) {
    return res.status(400).json({ success: false, message: "Submission failed." }); // Obscured missing fields
  }

  // 5. Sanitization (XSS filtering)
  const safeName = sanitize(name);
  const safeEmail = sanitize(email);
  const safeCompany = sanitize(company);
  const safeReason = sanitize(reason);

  try {
    const { data, error } = await resend.emails.send({
      from: 'Hanlan Group <donggyun@hanlangroup.com>',
      to: ['tess@hanlangroup.com', 'donggyun@hanlangroup.com'],
      replyTo: safeEmail,
      subject: '[Inquiry] New Message from Hanlan Group Website',
      html: `
        <div style="font-family: serif; line-height: 1.6; color: #1a1a1a;">
          <h2 style="border-bottom: 1px solid #eee; padding-bottom: 10px;">New Business Enquiry</h2>
          <p><strong>Name:</strong> ${safeName}</p>
          <p><strong>Email:</strong> ${safeEmail}</p>
          <p><strong>Company:</strong> ${safeCompany || 'N/A'}</p>
          <p><strong>Reason:</strong> ${safeReason}</p>
          <div style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
            This enquiry was generated via the Hanlan Group institutional platform.
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Resend Error:', error);
      // Return 200 OK or generic error to obscure Resend failures
      return res.status(400).json({ success: false, message: "Submission failed." });
    }

    // Success response - obscure details
    return res.status(200).json({ success: true, message: "Enquiry received." });
  } catch (err: any) {
    console.error('Server Error:', err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
}
