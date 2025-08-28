import { Controller, Get, Param, Res, StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { AssetsService } from './assets.service';
import * as fs from 'fs';
import { createReadStream } from 'fs';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

@ApiTags('assets')
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get('secure/:token')
  @ApiOperation({ summary: 'Serve asset by secure token' })
  @ApiParam({ name: 'token', description: 'Secure token for asset access' })
  @ApiResponse({ status: 200, description: 'Asset served successfully' })
  @ApiResponse({ status: 403, description: 'Invalid or expired token' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async serveSecureAsset(
    @Param('token') token: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { filePath, mimeType, size } =
      await this.assetsService.serveSecureAsset(token);

    // Set appropriate headers BEFORE creating the stream
    response.set({
      'Content-Type': mimeType || 'application/octet-stream',
      'Content-Length': size.toString(),
      'Cache-Control': 'private, no-cache, no-store, must-revalidate', // Prevent caching
      Pragma: 'no-cache',
      Expires: '0',
      'X-Content-Type-Options': 'nosniff', // Security header
    });

    // Create stream and return as StreamableFile
    const stream = createReadStream(filePath);
    return new StreamableFile(stream, {
      type: mimeType || 'application/octet-stream',
      disposition: 'inline', // Display in browser instead of download
    });
  }

  @Get('metadata/:assetId')
  @ApiOperation({ summary: 'Get asset metadata' })
  @ApiParam({ name: 'assetId', description: 'Asset ID' })
  @ApiResponse({
    status: 200,
    description: 'Asset metadata retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async getAssetMetadata(@Param('assetId') assetId: string) {
    return this.assetsService.getAssetMetadata(assetId);
  }

  @Get('temp-url/:assetId')
  @ApiOperation({ summary: 'Generate temporary URL for asset' })
  @ApiParam({ name: 'assetId', description: 'Asset ID' })
  @ApiResponse({
    status: 200,
    description: 'Temporary URL generated successfully',
  })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async generateTempUrl(@Param('assetId') assetId: string) {
    const tempUrl = await this.assetsService.generateTempUrl(assetId);
    return { tempUrl };
  }
}
