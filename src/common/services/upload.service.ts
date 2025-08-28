import { Injectable } from '@nestjs/common';
import { PrismaClient } from '../../../generated/prisma';
import type { Asset } from '../../../generated/prisma';
import { AssetProvider } from '../../../generated/prisma';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class UploadService {
  private readonly prisma: PrismaClient;
  private readonly baseUploadDir: string;

  // Map of MIME types to their possible file extensions
  private readonly mimeToExtensions: Record<string, string[]> = {
    'image/apng': ['.apng', '.png'],
    'image/avif': ['.avif'],
    'image/gif': ['.gif'],
    'image/jpeg': ['.jpg', '.jpeg', '.jfif', '.pjpeg', '.pjp'],
    'image/png': ['.png'],
    'image/svg+xml': ['.svg'],
    'image/webp': ['.webp'],
  };

  // Map of file extensions to their MIME types
  private readonly extensionToMime: Record<string, string> = {
    '.apng': 'image/apng',
    '.avif': 'image/avif',
    '.gif': 'image/gif',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.jfif': 'image/jpeg',
    '.pjpeg': 'image/jpeg',
    '.pjp': 'image/jpeg',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
  };

  constructor() {
    this.prisma = new PrismaClient();
    // Set base upload directory
    this.baseUploadDir = path.join(process.cwd(), 'uploads');
    // Ensure base upload directory exists
    if (!fs.existsSync(this.baseUploadDir)) {
      fs.mkdirSync(this.baseUploadDir, { recursive: true });
    }
  }

  /**
   * Get the upload directory for a specific category
   * @param category The category of upload (e.g., 'items', 'characters', etc.)
   */
  private getUploadDir(category: string): string {
    const uploadDir = path.join(this.baseUploadDir, category);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    return uploadDir;
  }

  /**
   * Get supported MIME types
   */
  getSupportedMimeTypes(): string[] {
    return Object.keys(this.mimeToExtensions);
  }

  /**
   * Get supported file extensions
   */
  getSupportedExtensions(): string[] {
    return Object.keys(this.extensionToMime);
  }

  /**
   * Check if MIME type is supported
   */
  isMimeTypeSupported(mimeType: string): boolean {
    return mimeType in this.mimeToExtensions;
  }

  /**
   * Get file extension from MIME type
   * Returns the primary (first) extension for the MIME type
   */
  private getFileExtension(mimeType: string): string {
    const extensions = this.mimeToExtensions[mimeType];
    if (!extensions || extensions.length === 0) {
      throw new Error(`Unsupported MIME type: ${mimeType}`);
    }
    // Return the first (primary) extension
    return extensions[0];
  }

  /**
   * Uploads a file from base64 string and creates an Asset record
   * @param base64Data Base64 string of the file (can include data URI)
   * @param mimeType MIME type of the file
   * @param category The category of upload (e.g., 'items', 'characters', etc.)
   */
  async uploadFile(
    base64Data: string,
    mimeType: string,
    category: string = 'default',
  ): Promise<Asset> {
    if (!this.isMimeTypeSupported(mimeType)) {
      throw new Error(
        `Unsupported MIME type: ${mimeType}. Supported types are: ${this.getSupportedMimeTypes().join(
          ', ',
        )}`,
      );
    }

    // Remove data URI if present
    const base64Content = base64Data.replace(/^data:.*?;base64,/, '');

    // Generate random filename with the correct extension
    const fileExt = this.getFileExtension(mimeType);
    const fileName = `${crypto.randomBytes(16).toString('hex')}${fileExt}`;

    // Get the category-specific upload directory
    const uploadDir = this.getUploadDir(category);
    const filePath = path.join(uploadDir, fileName);
    const relativePath = path.join(category, fileName);

    // Convert base64 to buffer and save
    const fileBuffer = Buffer.from(base64Content, 'base64');
    fs.writeFileSync(filePath, fileBuffer);

    // Create asset record
    const asset = await this.prisma.asset.create({
      data: {
        path: relativePath, // Store relative path including category
        provider: AssetProvider.LOCAL,
        url: `/uploads/${relativePath}`, // URL will include category
        mimeType,
        size: fileBuffer.length,
      },
    });

    return asset;
  }

  /**
   * Delete an asset and its associated file
   */
  async deleteAsset(assetId: string): Promise<void> {
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) return;

    // Delete file if it exists
    if (asset.provider === AssetProvider.LOCAL) {
      const filePath = path.join(this.baseUploadDir, asset.path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete asset record
    await this.prisma.asset.delete({
      where: { id: assetId },
    });
  }
}
