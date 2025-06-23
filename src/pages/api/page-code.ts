import fs from 'fs';
import path from 'path';
import { NextApiRequest, NextApiResponse } from 'next';
import * as babelParser from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { promises as fsPromises } from 'fs';

// Utility: Convert DesignerElement[] to JSX string (very basic example)
function layoutToJSX(layout: any[]): string {
  return layout.map((el: any) => {
    if (el.type === 'text') return `<div style={{position:'absolute',left:${el.x*32},top:${el.y*32},fontSize:${el.style.fontSize},color:'${el.style.color}'}}>${el.content}</div>`;
    if (el.type === 'heading') return `<h2 style={{position:'absolute',left:${el.x*32},top:${el.y*32},fontSize:${el.style.fontSize},color:'${el.style.color}'}}>${el.content}</h2>`;
    // ...handle other types
    return '';
  }).join('\n');
}

// Utility: Recursively parse JSX to DesignerElement[]
function jsxToLayout(jsx: string): any[] {
  const elements: any[] = [];
  let idCounter = 0;
  function nextId() {
    return `el-${Date.now()}-${idCounter++}-${Math.random().toString(36).slice(2, 6)}`;
  }
  let ast;
  try {
    ast = babelParser.parse(jsx, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });
  } catch (e) {
    return [];
  }
  // Utility: Tailwind spacing scale (partial, can be extended)
  const tailwindSpacing: Record<string, number> = {
    '0': 0,
    '1': 0.25,
    '2': 0.5,
    '3': 0.75,
    '4': 1,
    '5': 1.25,
    '6': 1.5,
    '8': 2,
    '10': 2.5,
    '12': 3,
    '16': 4,
    '20': 5,
    '24': 6,
    '32': 8,
    '40': 10,
    '48': 12,
    '56': 14,
    '64': 16,
  };

  function extractSpacing(classNames: string) {
    const margin: any = {};
    const padding: any = {};
    let gap = 0;
    // Margin
    const marginMatch = classNames.match(/m([trblxy]?)-([\d]+)/g) || [];
    marginMatch.forEach((cls) => {
      const [, dir, val] = cls.match(/m([trblxy]?)-([\d]+)/) || [];
      const n = tailwindSpacing[val] ?? 0;
      if (!dir) margin.all = n;
      else if (dir === 't') margin.top = n;
      else if (dir === 'b') margin.bottom = n;
      else if (dir === 'l') margin.left = n;
      else if (dir === 'r') margin.right = n;
      else if (dir === 'x') { margin.left = n; margin.right = n; }
      else if (dir === 'y') { margin.top = n; margin.bottom = n; }
    });
    // Padding
    const paddingMatch = classNames.match(/p([trblxy]?)-([\d]+)/g) || [];
    paddingMatch.forEach((cls) => {
      const [, dir, val] = cls.match(/p([trblxy]?)-([\d]+)/) || [];
      const n = tailwindSpacing[val] ?? 0;
      if (!dir) padding.all = n;
      else if (dir === 't') padding.top = n;
      else if (dir === 'b') padding.bottom = n;
      else if (dir === 'l') padding.left = n;
      else if (dir === 'r') padding.right = n;
      else if (dir === 'x') { padding.left = n; padding.right = n; }
      else if (dir === 'y') { padding.top = n; padding.bottom = n; }
    });
    // Gap
    const gapMatch = classNames.match(/gap-([\d]+)/);
    if (gapMatch) {
      gap = tailwindSpacing[gapMatch[1]] ?? 0;
    }
    return { margin, padding, gap };
  }

  function parseJSXElement(node: t.JSXElement, parentId?: string, parentLayout?: { flexDir?: string, nextX?: number, nextY?: number }): any[] {
    const opening = node.openingElement;
    const tag = opening.name.type === 'JSXIdentifier' ? opening.name.name : 'custom';
    let style: any = {};
    let content = '';
    let x = parentLayout?.nextX ?? 0;
    let y = parentLayout?.nextY ?? 0;
    let w = 6, h = 2, fontSize = 16, color = '#fff';
    let flexDir = parentLayout?.flexDir || 'col';
    // Extract className prop for layout mapping
    const classAttr = opening.attributes.find(
      (attr) => attr.type === 'JSXAttribute' && attr.name && attr.name.name === 'className'
    ) as t.JSXAttribute | undefined;
    let classNames = '';
    let spacing = { margin: {}, padding: {}, gap: 0 };
    if (classAttr && classAttr.value && classAttr.value.type === 'StringLiteral') {
      classNames = classAttr.value.value;
      // Map Tailwind/flex/grid classes to w, h, flexDir
      if (classNames.includes('w-full')) w = 24;
      if (classNames.includes('h-full')) h = 12;
      if (classNames.includes('w-1/2')) w = 12;
      if (classNames.includes('w-1/3')) w = 8;
      if (classNames.includes('w-1/4')) w = 6;
      if (classNames.includes('h-1/2')) h = 6;
      if (classNames.includes('h-1/3')) h = 4;
      if (classNames.includes('h-1/4')) h = 3;
      if (classNames.includes('flex-row')) flexDir = 'row';
      if (classNames.includes('flex-col')) flexDir = 'col';
      if (classNames.includes('flex') && !classNames.includes('flex-row') && !classNames.includes('flex-col')) flexDir = 'row';
      // Margin mapping (very basic)
      if (classNames.match(/ml-\d+/)) x += 2;
      if (classNames.match(/mt-\d+/)) y += 2;
      // Add more mappings as needed
      spacing = extractSpacing(classNames);
    }
    // Extract style prop
    const styleAttr = opening.attributes.find(
      (attr) => attr.type === 'JSXAttribute' && attr.name && attr.name.name === 'style'
    ) as t.JSXAttribute | undefined;
    if (
      styleAttr &&
      styleAttr.value &&
      styleAttr.value.type === 'JSXExpressionContainer' &&
      styleAttr.value.expression.type === 'ObjectExpression'
    ) {
      styleAttr.value.expression.properties.forEach((prop) => {
        if (prop.type === 'ObjectProperty' && prop.key.type === 'Identifier') {
          if (prop.value.type === 'StringLiteral' || prop.value.type === 'NumericLiteral') {
            style[prop.key.name] = prop.value.value;
          }
        }
      });
      if (style.left) x = Math.round(style.left / 32);
      if (style.top) y = Math.round(style.top / 32);
      fontSize = style.fontSize || fontSize;
      color = style.color || color;
    }
    // Extract text content
    if (node.children && node.children.length > 0) {
      const textNode = node.children.find((c) => c.type === 'JSXText') as t.JSXText | undefined;
      if (textNode) content = textNode.value.trim();
    }
    // Map tag to element type
    let type: string = 'box';
    if (tag === 'div') type = 'box';
    else if (tag === 'h1' || tag === 'h2' || tag === 'h3') type = 'heading';
    else if (tag === 'p' || tag === 'span') type = 'text';
    else if (tag === 'img') type = 'image';
    else if (tag === 'a') type = 'link';
    else if (tag === 'button') type = 'button';
    else type = 'custom';
    const id = nextId();
    const el: any = {
      id,
      type,
      content,
      x, y, w, h,
      style: { fontSize, color, background: 'transparent' },
      parentId,
      children: [],
      margin: spacing.margin,
      padding: spacing.padding,
      gap: spacing.gap,
    };
    // For images, extract src/alt
    if (type === 'image') {
      const srcAttr = opening.attributes.find(
        (attr) => attr.type === 'JSXAttribute' && attr.name && attr.name.name === 'src'
      ) as t.JSXAttribute | undefined;
      if (srcAttr && srcAttr.value && srcAttr.value.type === 'StringLiteral') {
        el.content = srcAttr.value.value;
      }
      const altAttr = opening.attributes.find(
        (attr) => attr.type === 'JSXAttribute' && attr.name && attr.name.name === 'alt'
      ) as t.JSXAttribute | undefined;
      if (altAttr && altAttr.value && altAttr.value.type === 'StringLiteral') {
        el.alt = altAttr.value.value;
      }
    }
    // For links, extract href
    if (type === 'link') {
      const hrefAttr = opening.attributes.find(
        (attr) => attr.type === 'JSXAttribute' && attr.name && attr.name.name === 'href'
      ) as t.JSXAttribute | undefined;
      if (hrefAttr && hrefAttr.value && hrefAttr.value.type === 'StringLiteral') {
        el.content = hrefAttr.value.value;
      }
    }
    // Recursively parse children and simulate layout
    const childEls: any[] = [];
    let childX = 0, childY = 0;
    node.children.forEach((child) => {
      if (child.type === 'JSXElement') {
        // For flex-row, increment x; for flex-col, increment y
        const childLayout = flexDir === 'row'
          ? { flexDir, nextX: childX, nextY: 0 }
          : { flexDir, nextX: 0, nextY: childY };
        const parsed = parseJSXElement(child, id, childLayout);
        if (parsed.length) {
          childEls.push(...parsed);
          el.children.push(...parsed.map((c: any) => c.id));
          if (flexDir === 'row') childX += parsed[0].w || 6;
          else childY += parsed[0].h || 2;
        }
      }
    });
    return [el, ...childEls];
  }
  traverse(ast, {
    JSXElement(path: NodePath<t.JSXElement>) {
      if (!path.parentPath || path.parentPath.type !== 'JSXElement') {
        // Only parse root-level JSX elements
        const parsed = parseJSXElement(path.node);
        if (parsed.length) elements.push(...parsed);
      }
    },
  });
  return elements;
}

const PAGES_DIR = path.join(process.cwd(), 'src/pages');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { page } = req.query;
  let filePath = typeof page === 'string' ? page.replace(/^\/+/, '') : '';
  if (!filePath.endsWith('.tsx')) filePath += '.tsx';
  const absPath = path.join(PAGES_DIR, filePath);

  if (req.method === 'POST') {
    // Generate .tsx file from layout
    const { layout } = req.body;
    const jsx = layoutToJSX(layout);
    const code = `export default function Page() {\n  return (<div>${jsx}</div>);\n}`;
    await fsPromises.writeFile(absPath, code, 'utf8');
    return res.status(200).json({ success: true });
  }

  if (req.method === 'GET') {
    if (!fs.existsSync(absPath)) return res.status(404).json({ error: 'Page not found' });
    const code = await fsPromises.readFile(absPath, 'utf8');
    // Try to extract the JSX inside the return statement (very basic)
    const match = code.match(/return\s*\(([^]*)\);/);
    const jsx = match ? match[1].trim() : '';
    const layout = jsxToLayout(code);
    return res.status(200).json({ layout, jsx, code });
  }

  res.status(405).end();
}
