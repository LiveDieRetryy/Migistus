import type { NextApiRequest, NextApiResponse } from 'next';

// Dummy page content for demonstration
const PAGE_CONTENT: Record<string, { html: string; css: string }> = {
  voting: {
    html: `<div class="p-8" style="background:#222; color:#facc15;"><h1 style="font-size:2rem; font-weight:bold; margin-bottom:1rem;">Voting Page</h1><p style="margin-bottom:0.5rem;">This is a sample voting page. You can edit this content in the WebDesigner.</p></div>`,
    css: '',
  },
  homepage: {
    html: `<div class="p-8" style="background:#222; color:#facc15;"><h1 style="font-size:2rem; font-weight:bold; margin-bottom:1rem;">Homepage</h1><p style="margin-bottom:0.5rem;">Welcome to the homepage! Edit this in the WebDesigner.</p></div>`,
    css: '',
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { page } = req.query;
  const key = typeof page === 'string' ? page.replace(/^\/+/, '') : 'homepage';
  const content = PAGE_CONTENT[key] || PAGE_CONTENT['homepage'];
  res.status(200).json(content);
}
