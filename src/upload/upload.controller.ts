import {
  Controller,
  Post,
  Delete,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Req,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
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
import { Request } from 'express';
import { UploadService } from './upload.service';
import { HomestayService } from '../homestay/homestay.service';

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
    if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp|pdf)$/)) {
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
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
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
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;

    const urls = await this.uploadService.handleMultipleFilesUpload(
      files,
      baseUrl,
    );
    const updatedRoom = await this.homestayService.addRoomImages(roomId, urls);
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
  async deleteImage(@Body('url') url: string) {
    if (!url) {
      throw new BadRequestException('Image URL/filename is required');
    }
    await this.uploadService.deleteFile(url);
    return { message: 'Image deleted successfully' };
  }
}
