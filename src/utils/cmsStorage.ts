import { db } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data', 'cms');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating data directory:', error);
  }
}

// File-based storage helpers
async function readJsonFile(filename: string) {
  try {
    await ensureDataDir();
    const filePath = path.join(DATA_DIR, filename);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function writeJsonFile(filename: string, data: any) {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// Database implementation
class DatabaseCMSStorage {
  // Pages
  async createPage(data: any) {
    return await db.createPage(data);
  }

  async getPage(id: number) {
    return await db.getPage(id);
  }

  async getPageBySlug(slug: string) {
    return await db.getPageBySlug(slug);
  }

  async getPages(filters: any) {
    return await db.getPages(filters);
  }

  async updatePage(id: number, data: any) {
    return await db.updatePage(id, data);
  }

  async deletePage(id: number) {
    return await db.deletePage(id);
  }

  // Page Versions
  async createPageVersion(data: any) {
    return await db.createPageVersion(data);
  }

  async getPageVersions(pageId: number, limit?: number) {
    return await db.getPageVersions(pageId, limit);
  }

  async getPageVersion(id: number) {
    return await db.getPageVersion(id);
  }

  async restorePageVersion(pageId: number, versionId: number) {
    return await db.restorePageVersion(pageId, versionId);
  }

  // Media Library
  async createMedia(data: any) {
    return await db.createMedia(data);
  }

  async getMedia(id: number) {
    return await db.getMedia(id);
  }

  async getMediaList(filters: any) {
    return await db.getMediaList(filters);
  }

  async updateMedia(id: number, data: any) {
    return await db.updateMedia(id, data);
  }

  async deleteMedia(id: number) {
    return await db.deleteMedia(id);
  }

  // Content Blocks
  async createContentBlock(data: any) {
    return await db.createContentBlock(data);
  }

  async getContentBlock(id: number) {
    return await db.getContentBlock(id);
  }

  async getContentBlocks(filters: any) {
    return await db.getContentBlocks(filters);
  }

  async updateContentBlock(id: number, data: any) {
    return await db.updateContentBlock(id, data);
  }

  async deleteContentBlock(id: number) {
    return await db.deleteContentBlock(id);
  }

  // Navigation Menus
  async createNavigationMenu(data: any) {
    return await db.createNavigationMenu(data);
  }

  async getNavigationMenu(id: number) {
    return await db.getNavigationMenu(id);
  }

  async getNavigationMenuByLocation(location: string) {
    return await db.getNavigationMenuByLocation(location);
  }

  async getNavigationMenus() {
    return await db.getNavigationMenus();
  }

  async updateNavigationMenu(id: number, data: any) {
    return await db.updateNavigationMenu(id, data);
  }

  async deleteNavigationMenu(id: number) {
    return await db.deleteNavigationMenu(id);
  }

  // SEO Settings
  async createSEO(data: any) {
    return await db.createSEO(data);
  }

  async getSEO(pageId: number) {
    return await db.getSEO(pageId);
  }

  async updateSEO(pageId: number, data: any) {
    return await db.updateSEO(pageId, data);
  }

  // Categories
  async createCategory(data: any) {
    return await db.createCategory(data);
  }

  async getCategory(id: number) {
    return await db.getCategory(id);
  }

  async getCategoryBySlug(slug: string) {
    return await db.getCategoryBySlug(slug);
  }

  async getCategories(parentId?: number) {
    return await db.getCategories(parentId);
  }

  async updateCategory(id: number, data: any) {
    return await db.updateCategory(id, data);
  }

  async deleteCategory(id: number) {
    return await db.deleteCategory(id);
  }

  // Templates
  async createTemplate(data: any) {
    return await db.createTemplate(data);
  }

  async getTemplate(id: number) {
    return await db.getTemplate(id);
  }

  async getTemplates() {
    return await db.getTemplates();
  }

  async updateTemplate(id: number, data: any) {
    return await db.updateTemplate(id, data);
  }

  async deleteTemplate(id: number) {
    return await db.deleteTemplate(id);
  }
}

// File-based storage implementation
class FileCMSStorage {
  // Pages
  async createPage(data: any) {
    const pages = await readJsonFile('pages.json');
    const newPage = {
      id: pages.length + 1,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    pages.push(newPage);
    await writeJsonFile('pages.json', pages);
    return newPage;
  }

  async getPage(id: number) {
    const pages = await readJsonFile('pages.json');
    return pages.find((p: any) => p.id === id) || null;
  }

  async getPageBySlug(slug: string) {
    const pages = await readJsonFile('pages.json');
    return pages.find((p: any) => p.slug === slug) || null;
  }

  async getPages(filters: any) {
    const pages = await readJsonFile('pages.json');
    let filtered = pages;

    if (filters.status) {
      filtered = filtered.filter((p: any) => p.status === filters.status);
    }
    if (filters.categoryId) {
      filtered = filtered.filter((p: any) => p.categoryId === filters.categoryId);
    }
    if (filters.authorId) {
      filtered = filtered.filter((p: any) => p.authorId === filters.authorId);
    }

    const sorted = filtered.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const offset = filters.offset || 0;
    const limit = filters.limit || 50;
    return sorted.slice(offset, offset + limit);
  }

  async updatePage(id: number, data: any) {
    const pages = await readJsonFile('pages.json');
    const index = pages.findIndex((p: any) => p.id === id);
    
    if (index === -1) return null;

    pages[index] = {
      ...pages[index],
      ...data,
      updatedAt: new Date().toISOString()
    };

    await writeJsonFile('pages.json', pages);
    return pages[index];
  }

  async deletePage(id: number) {
    const pages = await readJsonFile('pages.json');
    const filtered = pages.filter((p: any) => p.id !== id);
    await writeJsonFile('pages.json', filtered);
  }

  // Page Versions
  async createPageVersion(data: any) {
    const versions = await readJsonFile('page_versions.json');
    const newVersion = {
      id: versions.length + 1,
      ...data,
      createdAt: new Date().toISOString()
    };
    versions.push(newVersion);
    await writeJsonFile('page_versions.json', versions);
    return newVersion;
  }

  async getPageVersions(pageId: number, limit: number = 50) {
    const versions = await readJsonFile('page_versions.json');
    return versions
      .filter((v: any) => v.pageId === pageId)
      .sort((a: any, b: any) => b.versionNumber - a.versionNumber)
      .slice(0, limit);
  }

  async getPageVersion(id: number) {
    const versions = await readJsonFile('page_versions.json');
    return versions.find((v: any) => v.id === id) || null;
  }

  async restorePageVersion(pageId: number, versionId: number) {
    const version = await this.getPageVersion(versionId);
    if (!version || version.pageId !== pageId) return null;

    return await this.updatePage(pageId, { content: version.content });
  }

  // Media Library
  async createMedia(data: any) {
    const media = await readJsonFile('media_library.json');
    const newMedia = {
      id: media.length + 1,
      ...data,
      uploadedAt: new Date().toISOString()
    };
    media.push(newMedia);
    await writeJsonFile('media_library.json', media);
    return newMedia;
  }

  async getMedia(id: number) {
    const media = await readJsonFile('media_library.json');
    return media.find((m: any) => m.id === id) || null;
  }

  async getMediaList(filters: any) {
    const media = await readJsonFile('media_library.json');
    let filtered = media;

    if (filters.mimeType) {
      filtered = filtered.filter((m: any) => m.mimeType?.startsWith(filters.mimeType));
    }
    if (filters.uploadedBy) {
      filtered = filtered.filter((m: any) => m.uploadedBy === filters.uploadedBy);
    }

    const sorted = filtered.sort((a: any, b: any) => 
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );

    const offset = filters.offset || 0;
    const limit = filters.limit || 50;
    return sorted.slice(offset, offset + limit);
  }

  async updateMedia(id: number, data: any) {
    const media = await readJsonFile('media_library.json');
    const index = media.findIndex((m: any) => m.id === id);
    
    if (index === -1) return null;

    media[index] = {
      ...media[index],
      ...data
    };

    await writeJsonFile('media_library.json', media);
    return media[index];
  }

  async deleteMedia(id: number) {
    const media = await readJsonFile('media_library.json');
    const filtered = media.filter((m: any) => m.id !== id);
    await writeJsonFile('media_library.json', filtered);
  }

  // Content Blocks
  async createContentBlock(data: any) {
    const blocks = await readJsonFile('content_blocks.json');
    const newBlock = {
      id: blocks.length + 1,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    blocks.push(newBlock);
    await writeJsonFile('content_blocks.json', blocks);
    return newBlock;
  }

  async getContentBlock(id: number) {
    const blocks = await readJsonFile('content_blocks.json');
    return blocks.find((b: any) => b.id === id) || null;
  }

  async getContentBlocks(filters: any) {
    const blocks = await readJsonFile('content_blocks.json');
    let filtered = blocks;

    if (filters.type) {
      filtered = filtered.filter((b: any) => b.type === filters.type);
    }
    if (filters.isGlobal !== undefined) {
      filtered = filtered.filter((b: any) => b.isGlobal === filters.isGlobal);
    }

    const sorted = filtered.sort((a: any, b: any) => a.name.localeCompare(b.name));

    const offset = filters.offset || 0;
    const limit = filters.limit || 50;
    return sorted.slice(offset, offset + limit);
  }

  async updateContentBlock(id: number, data: any) {
    const blocks = await readJsonFile('content_blocks.json');
    const index = blocks.findIndex((b: any) => b.id === id);
    
    if (index === -1) return null;

    blocks[index] = {
      ...blocks[index],
      ...data,
      updatedAt: new Date().toISOString()
    };

    await writeJsonFile('content_blocks.json', blocks);
    return blocks[index];
  }

  async deleteContentBlock(id: number) {
    const blocks = await readJsonFile('content_blocks.json');
    const filtered = blocks.filter((b: any) => b.id !== id);
    await writeJsonFile('content_blocks.json', filtered);
  }

  // Navigation Menus
  async createNavigationMenu(data: any) {
    const menus = await readJsonFile('navigation_menus.json');
    const newMenu = {
      id: menus.length + 1,
      ...data,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    menus.push(newMenu);
    await writeJsonFile('navigation_menus.json', menus);
    return newMenu;
  }

  async getNavigationMenu(id: number) {
    const menus = await readJsonFile('navigation_menus.json');
    return menus.find((m: any) => m.id === id) || null;
  }

  async getNavigationMenuByLocation(location: string) {
    const menus = await readJsonFile('navigation_menus.json');
    const filtered = menus
      .filter((m: any) => m.location === location && m.isActive)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return filtered[0] || null;
  }

  async getNavigationMenus() {
    const menus = await readJsonFile('navigation_menus.json');
    return menus.sort((a: any, b: any) => a.name.localeCompare(b.name));
  }

  async updateNavigationMenu(id: number, data: any) {
    const menus = await readJsonFile('navigation_menus.json');
    const index = menus.findIndex((m: any) => m.id === id);
    
    if (index === -1) return null;

    menus[index] = {
      ...menus[index],
      ...data,
      updatedAt: new Date().toISOString()
    };

    await writeJsonFile('navigation_menus.json', menus);
    return menus[index];
  }

  async deleteNavigationMenu(id: number) {
    const menus = await readJsonFile('navigation_menus.json');
    const filtered = menus.filter((m: any) => m.id !== id);
    await writeJsonFile('navigation_menus.json', filtered);
  }

  // SEO Settings
  async createSEO(data: any) {
    const seos = await readJsonFile('seo_settings.json');
    const newSEO = {
      id: seos.length + 1,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    seos.push(newSEO);
    await writeJsonFile('seo_settings.json', seos);
    return newSEO;
  }

  async getSEO(pageId: number) {
    const seos = await readJsonFile('seo_settings.json');
    return seos.find((s: any) => s.pageId === pageId) || null;
  }

  async updateSEO(pageId: number, data: any) {
    const seos = await readJsonFile('seo_settings.json');
    const index = seos.findIndex((s: any) => s.pageId === pageId);
    
    if (index === -1) {
      // Create if doesn't exist
      return await this.createSEO({ ...data, pageId });
    }

    seos[index] = {
      ...seos[index],
      ...data,
      updatedAt: new Date().toISOString()
    };

    await writeJsonFile('seo_settings.json', seos);
    return seos[index];
  }

  // Categories
  async createCategory(data: any) {
    const categories = await readJsonFile('content_categories.json');
    const newCategory = {
      id: categories.length + 1,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    categories.push(newCategory);
    await writeJsonFile('content_categories.json', categories);
    return newCategory;
  }

  async getCategory(id: number) {
    const categories = await readJsonFile('content_categories.json');
    return categories.find((c: any) => c.id === id) || null;
  }

  async getCategoryBySlug(slug: string) {
    const categories = await readJsonFile('content_categories.json');
    return categories.find((c: any) => c.slug === slug) || null;
  }

  async getCategories(parentId?: number) {
    const categories = await readJsonFile('content_categories.json');
    
    if (parentId === undefined) {
      return categories.sort((a: any, b: any) => a.name.localeCompare(b.name));
    } else {
      return categories
        .filter((c: any) => c.parentId === parentId)
        .sort((a: any, b: any) => a.name.localeCompare(b.name));
    }
  }

  async updateCategory(id: number, data: any) {
    const categories = await readJsonFile('content_categories.json');
    const index = categories.findIndex((c: any) => c.id === id);
    
    if (index === -1) return null;

    categories[index] = {
      ...categories[index],
      ...data,
      updatedAt: new Date().toISOString()
    };

    await writeJsonFile('content_categories.json', categories);
    return categories[index];
  }

  async deleteCategory(id: number) {
    const categories = await readJsonFile('content_categories.json');
    const filtered = categories.filter((c: any) => c.id !== id);
    await writeJsonFile('content_categories.json', filtered);
  }

  // Templates
  async createTemplate(data: any) {
    const templates = await readJsonFile('page_templates.json');
    const newTemplate = {
      id: templates.length + 1,
      ...data,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    templates.push(newTemplate);
    await writeJsonFile('page_templates.json', templates);
    return newTemplate;
  }

  async getTemplate(id: number) {
    const templates = await readJsonFile('page_templates.json');
    return templates.find((t: any) => t.id === id) || null;
  }

  async getTemplates() {
    const templates = await readJsonFile('page_templates.json');
    return templates
      .filter((t: any) => t.isActive)
      .sort((a: any, b: any) => a.name.localeCompare(b.name));
  }

  async updateTemplate(id: number, data: any) {
    const templates = await readJsonFile('page_templates.json');
    const index = templates.findIndex((t: any) => t.id === id);
    
    if (index === -1) return null;

    templates[index] = {
      ...templates[index],
      ...data,
      updatedAt: new Date().toISOString()
    };

    await writeJsonFile('page_templates.json', templates);
    return templates[index];
  }

  async deleteTemplate(id: number) {
    const templates = await readJsonFile('page_templates.json');
    const index = templates.findIndex((t: any) => t.id === id);
    
    if (index !== -1) {
      templates[index].isActive = false;
      await writeJsonFile('page_templates.json', templates);
    }
  }
}

// Environment-based storage selector
const useDatabase = process.env.NEXT_PUBLIC_USE_DATABASE === 'true' || 
                    process.env.VERCEL_ENV === 'production' ||
                    process.env.NODE_ENV === 'production';

export const cmsStorage = useDatabase 
  ? new DatabaseCMSStorage() 
  : new FileCMSStorage();
