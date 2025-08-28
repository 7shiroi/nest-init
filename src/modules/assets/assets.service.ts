import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AssetsService {
  private readonly TEMP_URL_TTL = 300; // 5 minutes in seconds
  private readonly baseUploadDir: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {
    this.baseUploadDir = path.join(process.cwd(), 'uploads');
  }

  /**
   * Generate a temporary, signed URL for an asset
   * This prevents direct access to files and adds expiration
   */
  async generateTempUrl(
    assetId: string,
    expiresIn: number = this.TEMP_URL_TTL,
  ): Promise<string> {
    // Verify asset exists
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    // Generate signed token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + expiresIn * 1000;

    // Store token in Redis with asset ID and expiration
    await this.redis.set(
      `asset_token:${token}`,
      { assetId, expiresAt },
      expiresIn,
    );

    return `/assets/secure/${token}`;
  }

  /**
   * Serve asset by secure token
   */
  async serveSecureAsset(token: string): Promise<{
    filePath: string;
    mimeType: string;
    size: number;
  }> {
    // Get token data from Redis
    const tokenData = await this.redis.get<{
      assetId: string;
      expiresAt: number;
    }>(`asset_token:${token}`);

    if (!tokenData || Date.now() > tokenData.expiresAt) {
      throw new ForbiddenException('Invalid or expired token');
    }

    // Get asset info
    const asset = await this.prisma.asset.findUnique({
      where: { id: tokenData.assetId },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    // Construct file path
    const filePath = path.join(this.baseUploadDir, asset.path);

    // Verify file exists
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Asset file not found');
    }

    return {
      filePath,
      mimeType: asset.mimeType || 'application/octet-stream',
      size: asset.size || 0,
    };
  }

  /**
   * Get asset metadata without serving the file
   */
  async getAssetMetadata(assetId: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
      select: {
        id: true,
        mimeType: true,
        size: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    return asset;
  }

  /**
   * Clean up expired tokens (can be called via cron job)
   */
  async cleanupExpiredTokens(): Promise<void> {
    // This would be implemented based on your Redis cleanup strategy
    // For now, Redis TTL handles cleanup automatically
  }
}
