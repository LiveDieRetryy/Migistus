import { promises as fs } from 'fs';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';

const PAGES_DIR = path.join(process.cwd(), 'src/pages');
const IGNORED = ['_app.tsx', '_document.tsx', 'api', 'components', 'utils', 'public', 'styles', 'context', 'hooks', 'lib', 'types', 'configs', 'testing'];

function isPageFile(file: string) {
  return (
    (file.endsWith('.tsx') || file.endsWith('.js')) &&
    !IGNORED.includes(file)
  );
}

// Returns a tree of folders and pages
async function getPagesTree(dir = PAGES_DIR, base = ''): Promise<any> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  let children: any[] = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (IGNORED.includes(entry.name)) continue;
      const folderPath = path.join(base, entry.name).replace(/\\/g, '/');
      children.push({
        type: 'folder',
        name: entry.name,
        path: '/' + folderPath,
        children: await getPagesTree(path.join(dir, entry.name), folderPath)
      });
    } else if (isPageFile(entry.name)) {
      let pagePath = '/' + path.join(base, entry.name.replace(/\.(tsx|js)$/, ''))
        .replace(/\\/g, '/');
      let name = entry.name.replace(/\.(tsx|js)$/, '');
      if (entry.name.startsWith('index.')) {
        pagePath = '/' + base.replace(/\\/g, '/');
        if (pagePath === '/' || pagePath === '') {
          pagePath = '/';
          name = 'Home';
        } else {
          const parts = base.split(/[\\/]/).filter(Boolean);
          name = parts[parts.length - 1] || 'index';
        }
      }
      children.push({ type: 'page', name, path: pagePath });
    }
  }
  // Remove duplicates and empty paths
  return children.filter((p, i, arr) => p.path && arr.findIndex(x => x.path === p.path) === i);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // List all pages as a tree
    const tree = await getPagesTree();
    res.status(200).json({ tree });
  } else if (req.method === 'POST') {
    // Create a new page or folder
    const { name, section, type } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    if (type === 'folder') {
      // Create a new folder
      const folder = section && section !== '/' ? path.join(PAGES_DIR, section.replace(/^\//, '')) : PAGES_DIR;
      const newFolder = path.join(folder, name);
      await fs.mkdir(newFolder, { recursive: true });
      return res.status(201).json({ success: true });
    }
    // Create a new page (default)
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const folder = section && section !== '/' ? path.join(PAGES_DIR, section.replace(/^\//, '')) : PAGES_DIR;
    await fs.mkdir(folder, { recursive: true });
    const filePath = path.join(folder, `${slug}.tsx`);
    const compName = slug.replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase()).replace(/^./, (m: string) => m.toUpperCase());
    await fs.writeFile(filePath, `export default function ${compName}() {\n  return <div>${name} page</div>;\n}\n`);
    res.status(201).json({ success: true });
  } else if (req.method === 'DELETE') {
    // Delete a page
    const { path: pagePath } = req.body;
    if (!pagePath) return res.status(400).json({ error: 'Path required' });
    const filePath = path.join(PAGES_DIR, pagePath.replace(/^\//, '') + '.tsx');
    await fs.unlink(filePath);
    res.status(200).json({ success: true });
  } else if (req.method === 'PATCH') {
    // Rename a page
    const { oldPath, newName } = req.body;
    if (!oldPath || !newName) return res.status(400).json({ error: 'Old path and new name required' });
    const oldFile = path.join(PAGES_DIR, oldPath.replace(/^\//, '') + '.tsx');
    const newSlug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const newFile = path.join(path.dirname(oldFile), `${newSlug}.tsx`);
    await fs.rename(oldFile, newFile);
    res.status(200).json({ success: true });
  } else {
    res.status(405).end();
  }
}
