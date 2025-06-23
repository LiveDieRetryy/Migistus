import type { NextApiRequest, NextApiResponse } from 'next';
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { page } = req.query;
  // Map homepage/index
  let pagePath = typeof page === 'string' ? page.replace(/^\/+/, '') : '';
  if (pagePath === 'homepage' || pagePath === '') pagePath = '';
  // Build the URL to fetch the rendered HTML from the local server
  const url = `http://localhost:3000/${pagePath}`;
  let browser;
  try {
    browser = await puppeteer.launch({ headless: true });
    const pageObj = await browser.newPage();
    await pageObj.goto(url, { waitUntil: 'networkidle0', timeout: 20000 });
    // Wait for main h1 to exist and have non-empty text
    await pageObj.waitForSelector('main h1');
    await pageObj.waitForFunction(() => {
      const h1 = document.querySelector('main h1');
      return h1 && 'innerText' in h1 && (h1 as HTMLElement).innerText.trim().length > 0;
    });
    // Take a screenshot for debugging
    const screenshotPath = path.join(process.cwd(), 'puppeteer-debug.png') as `${string}.png`;
    await pageObj.screenshot({ path: screenshotPath });
    const html = await pageObj.content();
    await browser.close();
    // Extract <body> content
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const bodyHtml = bodyMatch ? bodyMatch[1] : html;
    // Extract <main> content from body
    const mainMatch = bodyHtml.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    const mainHtml = mainMatch ? `<main${(bodyHtml.match(/<main([^>]*)>/i)?.[1] || '')}>${mainMatch[1]}</main>` : bodyHtml;
    // Log the mainHtml to the server console
    console.log('Puppeteer extracted <main> HTML:', mainHtml);
    res.status(200).json({ html: mainHtml });
  } catch (err: any) {
    if (browser) await browser.close();
    res.status(500).json({ error: 'Failed to fetch rendered HTML with Puppeteer', details: err.message });
  }
}
