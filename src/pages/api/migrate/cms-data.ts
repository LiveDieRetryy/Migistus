import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '@/lib/session';
import { sql } from '@vercel/postgres';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

interface MigrationResult {
  table: string;
  migrated: number;
  failed: number;
  errors: string[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    // Verify user has Master or MIGISTUS tier
    const session = await getSessionFromRequest(req);

    if (!session || (session.tier !== 'master' && session.tier !== 'migistus')) {
      return res.status(403).json({ error: 'Forbidden - Master or MIGISTUS tier required' });
    }

    const results: MigrationResult[] = [];

    // Migrate pages
    const pagesResult = await migrateTable('pages', async (item: any) => {
      return await sql`
        INSERT INTO pages (id, title, slug, content, status, author_id, category_id, template_id, published_at, created_at, updated_at)
        VALUES (${item.id}, ${item.title}, ${item.slug}, ${item.content}, ${item.status}, ${item.author_id}, ${item.category_id}, ${item.template_id}, ${item.published_at}, ${item.created_at}, ${item.updated_at})
        ON CONFLICT (id) DO UPDATE
        SET title = EXCLUDED.title,
            slug = EXCLUDED.slug,
            content = EXCLUDED.content,
            status = EXCLUDED.status,
            author_id = EXCLUDED.author_id,
            category_id = EXCLUDED.category_id,
            template_id = EXCLUDED.template_id,
            published_at = EXCLUDED.published_at,
            updated_at = EXCLUDED.updated_at`;
    });
    results.push(pagesResult);

    // Migrate page versions
    const versionsResult = await migrateTable('page_versions', async (item: any) => {
      return await sql`
        INSERT INTO page_versions (id, page_id, version_number, content, created_by, created_at)
        VALUES (${item.id}, ${item.page_id}, ${item.version_number}, ${item.content}, ${item.created_by}, ${item.created_at})
        ON CONFLICT (id) DO UPDATE
        SET page_id = EXCLUDED.page_id,
            version_number = EXCLUDED.version_number,
            content = EXCLUDED.content,
            created_by = EXCLUDED.created_by,
            created_at = EXCLUDED.created_at`;
    });
    results.push(versionsResult);

    // Migrate media library
    const mediaResult = await migrateTable('media_library', async (item: any) => {
      return await sql`
        INSERT INTO media_library (id, filename, original_name, mime_type, size, url, alt, caption, uploaded_by, uploaded_at)
        VALUES (${item.id}, ${item.filename}, ${item.original_name}, ${item.mime_type}, ${item.size}, ${item.url}, ${item.alt}, ${item.caption}, ${item.uploaded_by}, ${item.uploaded_at})
        ON CONFLICT (id) DO UPDATE
        SET filename = EXCLUDED.filename,
            original_name = EXCLUDED.original_name,
            mime_type = EXCLUDED.mime_type,
            size = EXCLUDED.size,
            url = EXCLUDED.url,
            alt = EXCLUDED.alt,
            caption = EXCLUDED.caption,
            uploaded_by = EXCLUDED.uploaded_by,
            uploaded_at = EXCLUDED.uploaded_at`;
    });
    results.push(mediaResult);

    // Migrate content blocks
    const blocksResult = await migrateTable('content_blocks', async (item: any) => {
      return await sql`
        INSERT INTO content_blocks (id, name, type, content, is_global, created_at, updated_at)
        VALUES (${item.id}, ${item.name}, ${item.type}, ${item.content}, ${item.is_global}, ${item.created_at}, ${item.updated_at})
        ON CONFLICT (id) DO UPDATE
        SET name = EXCLUDED.name,
            type = EXCLUDED.type,
            content = EXCLUDED.content,
            is_global = EXCLUDED.is_global,
            updated_at = EXCLUDED.updated_at`;
    });
    results.push(blocksResult);

    // Migrate navigation menus
    const navResult = await migrateTable('navigation_menus', async (item: any) => {
      return await sql`
        INSERT INTO navigation_menus (id, name, location, items, is_active, created_at, updated_at)
        VALUES (${item.id}, ${item.name}, ${item.location}, ${JSON.stringify(item.items)}, ${item.is_active}, ${item.created_at}, ${item.updated_at})
        ON CONFLICT (id) DO UPDATE
        SET name = EXCLUDED.name,
            location = EXCLUDED.location,
            items = EXCLUDED.items,
            is_active = EXCLUDED.is_active,
            updated_at = EXCLUDED.updated_at`;
    });
    results.push(navResult);

    // Migrate SEO settings
    const seoResult = await migrateTable('seo_settings', async (item: any) => {
      return await sql`
        INSERT INTO seo_settings (id, page_id, meta_title, meta_description, meta_keywords, og_image, canonical_url, created_at, updated_at)
        VALUES (${item.id}, ${item.page_id}, ${item.meta_title}, ${item.meta_description}, ${item.meta_keywords}, ${item.og_image}, ${item.canonical_url}, ${item.created_at}, ${item.updated_at})
        ON CONFLICT (page_id) DO UPDATE
        SET meta_title = EXCLUDED.meta_title,
            meta_description = EXCLUDED.meta_description,
            meta_keywords = EXCLUDED.meta_keywords,
            og_image = EXCLUDED.og_image,
            canonical_url = EXCLUDED.canonical_url,
            updated_at = EXCLUDED.updated_at`;
    });
    results.push(seoResult);

    // Migrate content categories
    const categoriesResult = await migrateTable('content_categories', async (item: any) => {
      return await sql`
        INSERT INTO content_categories (id, name, slug, description, parent_id, created_at, updated_at)
        VALUES (${item.id}, ${item.name}, ${item.slug}, ${item.description}, ${item.parent_id}, ${item.created_at}, ${item.updated_at})
        ON CONFLICT (id) DO UPDATE
        SET name = EXCLUDED.name,
            slug = EXCLUDED.slug,
            description = EXCLUDED.description,
            parent_id = EXCLUDED.parent_id,
            updated_at = EXCLUDED.updated_at`;
    });
    results.push(categoriesResult);

    // Migrate page templates
    const templatesResult = await migrateTable('page_templates', async (item: any) => {
      return await sql`
        INSERT INTO page_templates (id, name, description, structure, is_active, created_at, updated_at)
        VALUES (${item.id}, ${item.name}, ${item.description}, ${item.structure}, ${item.is_active}, ${item.created_at}, ${item.updated_at})
        ON CONFLICT (id) DO UPDATE
        SET name = EXCLUDED.name,
            description = EXCLUDED.description,
            structure = EXCLUDED.structure,
            is_active = EXCLUDED.is_active,
            updated_at = EXCLUDED.updated_at`;
    });
    results.push(templatesResult);

    const totalMigrated = results.reduce((sum, r) => sum + r.migrated, 0);
    const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);

    return res.status(200).json({
      success: true,
      totalMigrated,
      totalFailed,
      results
    });

  } catch (error) {
    console.error('CMS migration error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function migrateTable(
  tableName: string,
  insertFn: (item: any) => Promise<any>
): Promise<MigrationResult> {
  const result: MigrationResult = {
    table: tableName,
    migrated: 0,
    failed: 0,
    errors: []
  };

  try {
    const filePath = path.join(DATA_DIR, `${tableName}.json`);

    if (!fs.existsSync(filePath)) {
      result.errors.push(`File not found: ${tableName}.json`);
      return result;
    }

    const fileData = fs.readFileSync(filePath, 'utf-8');
    const items = JSON.parse(fileData);

    if (!Array.isArray(items)) {
      result.errors.push(`Invalid data format: ${tableName}.json`);
      return result;
    }

    for (const item of items) {
      try {
        await insertFn(item);
        result.migrated++;
      } catch (error: any) {
        result.failed++;
        result.errors.push(`${tableName} ID ${item.id}: ${error.message}`);
      }
    }

  } catch (error: any) {
    result.errors.push(`Table migration failed: ${error.message}`);
  }

  return result;
}
