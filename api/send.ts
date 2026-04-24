import { Resend } from 'resend';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { name, email, company, reason } = req.body;

  if (!name || !email || !reason) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Hanlan Group <donggyun@hanlangroup.com>',
      to: ['tess@hanlangroup.com', 'donggyun@hanlangroup.com'],
      reply_to: email, // Directly reply to the customer's email
      subject: '[Inquiry] New Message from Hanlan Group Website',
      html: `
        <div style="font-family: serif; line-height: 1.6; color: #1a1a1a;">
          <h2 style="border-bottom: 1px solid #eee; padding-bottom: 10px;">New Business Enquiry</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Company:</strong> ${company || 'N/A'}</p>
          <p><strong>Reason:</strong> ${reason}</p>
          <div style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
            This enquiry was generated via the Hanlan Group institutional platform.
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Resend Error:', error);
      return res.status(400).json(error);
    }

    return res.status(200).json(data);
  } catch (err: any) {
    console.error('Server Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
