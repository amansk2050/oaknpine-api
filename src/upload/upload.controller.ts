import {
  Controller,
  Post,
  Delete,
  Get,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Req,
  Res,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { Request, Response } from 'express';
import { existsSync, createReadStream } from 'fs';
import { join } from 'path';
import { UploadService } from './upload.service';
import { HomestayService } from '../homestay/homestay.service';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';

const ALLOWED_MIME_PATTERN = /\/(jpg|jpeg|png|gif|webp|pdf)$/;

/**
 * Validates file type by inspecting magic bytes (file content header),
 * not the client-declared MIME type which can be spoofed.
 */
function validateMagicBytes(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;
  const b = buffer;

  // JPEG: FF D8 FF
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return true;
  // PNG: 89 50 4E 47
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47)
    return true;
  // GIF: 47 49 46 38
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38)
    return true;
  // PDF: 25 50 44 46 (%PDF)
  if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46)
    return true;
  // WebP: RIFF....WEBP (bytes 0-3 = RIFF, bytes 8-11 = WEBP)
  if (
    buffer.length >= 12 &&
    b[0] === 0x52 &&
    b[1] === 0x49 &&
    b[2] === 0x46 &&
    b[3] === 0x46 &&
    b[8] === 0x57 &&
    b[9] === 0x45 &&
    b[10] === 0x42 &&
    b[11] === 0x50
  )
    return true;

  return false;
}

const multerOptions = {
  storage: memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (
    req: Request,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    // First-pass MIME check (client-declared; validated further by magic bytes after upload)
    if (!ALLOWED_MIME_PATTERN.test(file.mimetype)) {
      return callback(
        new BadRequestException('Only image and PDF files are allowed!'),
        false,
      );
    }
    callback(null, true);
  },
};

@ApiTags('Media & Uploads')
@Controller('upload')
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly homestayService: HomestayService,
  ) {}

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Upload a single media file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    if (!validateMagicBytes(file.buffer)) {
      throw new BadRequestException(
        'File content does not match an allowed type (jpg, jpeg, png, gif, webp, pdf)',
      );
    }
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;
    return this.uploadService.handleFileUpload(file, baseUrl);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Upload multiple images for a homestay' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'homestayId', description: 'UUID of the homestay' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
      required: ['files'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Images uploaded and added to homestay successfully',
  })
  @Post('homestay/:homestayId/images')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FilesInterceptor('files', 10, multerOptions))
  async uploadHomestayImages(
    @Param('homestayId') homestayId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: Request,
    @CurrentTenant() tenantId: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }
    for (const file of files) {
      if (!validateMagicBytes(file.buffer)) {
        throw new BadRequestException(
          `File "${file.originalname}" content does not match an allowed type`,
        );
      }
    }
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;

    const urls = await this.uploadService.handleMultipleFilesUpload(
      files,
      baseUrl,
    );
    const updatedHomestay = await this.homestayService.addImages(
      homestayId,
      urls,
      tenantId,
    );
    return {
      message: 'Images uploaded and added successfully',
      urls,
      homestay: updatedHomestay,
    };
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Upload multiple images for a room' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'roomId', description: 'UUID of the room' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
      required: ['files'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Images uploaded and added to room successfully',
  })
  @Post('room/:roomId/images')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FilesInterceptor('files', 10, multerOptions))
  async uploadRoomImages(
    @Param('roomId') roomId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: Request,
    @CurrentTenant() tenantId: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }
    for (const file of files) {
      if (!validateMagicBytes(file.buffer)) {
        throw new BadRequestException(
          `File "${file.originalname}" content does not match an allowed type`,
        );
      }
    }
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;

    const urls = await this.uploadService.handleMultipleFilesUpload(
      files,
      baseUrl,
    );
    const updatedRoom = await this.homestayService.addRoomImages(roomId, urls, tenantId);
    return {
      message: 'Images uploaded and added successfully',
      urls,
      room: updatedRoom,
    };
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete an uploaded image' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'Full URL or filename of the image to delete',
          example: 'http://localhost:3000/uploads/some-uuid.jpg',
        },
      },
      required: ['url'],
    },
  })
  @ApiResponse({ status: 200, description: 'Image deleted successfully' })
  @Delete('image')
  @HttpCode(HttpStatus.OK)
  async deleteImage(@Body('url') url: string, @Req() req: Request) {
    if (!url) {
      throw new BadRequestException('Image URL/filename is required');
    }

    // Ensure the URL points to our own server or our GCS bucket — prevents
    // arbitrary remote deletions. Full per-resource ownership checks require
    // a file-ownership DB table (future improvement).
    const protocol = req.protocol;
    const host = req.get('host');
    const serverBaseUrl = `${protocol}://${host}`;
    const gcsBucketName = process.env.GCS_BUCKET_NAME;
    const gcsBucketUrl = gcsBucketName
      ? `https://storage.googleapis.com/${gcsBucketName}/`
      : null;

    const isOwnServerUrl = url.startsWith(`${serverBaseUrl}/uploads/`);
    const isGcsUrl = gcsBucketUrl ? url.startsWith(gcsBucketUrl) : false;

    if (!isOwnServerUrl && !isGcsUrl) {
      throw new BadRequestException(
        'URL does not point to a file managed by this server',
      );
    }

    await this.uploadService.deleteFile(url);
    return { message: 'Image deleted successfully' };
  }

  /* ── Serve local upload files through authenticated endpoint ──────────── */
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Retrieve an uploaded file (authenticated)',
    description:
      'Serves locally-stored upload files. Only available when GCS is not configured.',
  })
  @ApiParam({ name: 'filename', description: 'UUID filename of the file' })
  @ApiResponse({ status: 200, description: 'File content' })
  @Get('file/:filename')
  async serveFile(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    // Reject path traversal attempts
    if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
      throw new BadRequestException('Invalid filename');
    }

    const filePath = join(process.cwd(), 'uploads', filename);
    if (!existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    const stream = createReadStream(filePath);
    stream.pipe(res);
  }
}
