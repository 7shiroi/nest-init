import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { FileUpload } from '../interfaces/file-upload.interface';

export class ImageUploadDto implements FileUpload {
  @ApiProperty({
    description: 'Base64 encoded image data',
    example:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^data:image\/(jpeg|png|gif|webp|svg\+xml|apng|avif);base64,/, {
    message:
      'Invalid image format. Must be a data URI with supported image MIME type',
  })
  base64Data: string;

  @ApiProperty({
    description: 'MIME type of the image',
    example: 'image/png',
    enum: [
      'image/apng',
      'image/avif',
      'image/gif',
      'image/jpeg',
      'image/png',
      'image/svg+xml',
      'image/webp',
    ],
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^image\/(jpeg|png|gif|webp|svg\+xml|apng|avif)$/, {
    message:
      'Invalid MIME type. Must be one of: image/jpeg, image/png, image/gif, image/webp, image/svg+xml, image/apng, image/avif',
  })
  mimeType: string;
}
