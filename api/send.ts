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
      from: 'Hanlan Group Inquiry <onboarding@resend.dev>',
      to: ['donggyun@hanlangroup.com', 'tess@hanlangroup.com'],
      subject: 'New Business Enquiry from Hanlan Group Website',
      html: `
        <h2>New Business Enquiry Received</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Company:</strong> ${company || 'N/A'}</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <br/>
        <hr/>
        <p>This enquiry was sent via the Hanlan Group institutional platform.</p>
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
