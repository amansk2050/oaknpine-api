import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage, Bucket, StorageOptions } from '@google-cloud/storage';
import { existsSync, mkdirSync, promises as fsPromises } from 'fs';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadPath = join(process.cwd(), 'uploads');
  private storage: Storage | null = null;
  private bucket: Bucket | null = null;
  private gcsBucketName: string | null = null;

  constructor(private readonly configService: ConfigService) {
    const projectId = this.configService.get<string>('GCS_PROJECT_ID');
    const bucketName = this.configService.get<string>('GCS_BUCKET_NAME');
    const keyFilePath = this.configService.get<string>('GCS_KEY_FILE_PATH');

    let isGCSConfigured = false;
    if (projectId && bucketName) {
      try {
        const storageOptions: StorageOptions = { projectId };
        if (keyFilePath) {
          const resolvedPath = keyFilePath.startsWith('.')
            ? join(process.cwd(), keyFilePath)
            : keyFilePath;
          if (existsSync(resolvedPath)) {
            storageOptions.keyFilename = resolvedPath;
            isGCSConfigured = true;
          } else {
            this.logger.warn(
              `GCS key file not found at: ${resolvedPath}. Falling back to local storage.`,
            );
          }
        } else {
          // If no key file path is provided but project/bucket are set, try using default/environment auth
          isGCSConfigured = true;
        }

        if (isGCSConfigured) {
          this.storage = new Storage(storageOptions);
          this.bucket = this.storage.bucket(bucketName);
          this.gcsBucketName = bucketName;
          this.logger.log(
            `Google Cloud Storage configured successfully using bucket: ${bucketName}`,
          );
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `Failed to configure Google Cloud Storage: ${msg}. Falling back to local storage.`,
        );
        isGCSConfigured = false;
      }
    }

    if (!isGCSConfigured && !existsSync(this.uploadPath)) {
      mkdirSync(this.uploadPath, { recursive: true });
      this.logger.log(`Created local uploads directory at: ${this.uploadPath}`);
    }
  }

  async handleFileUpload(
    file: Express.Multer.File,
    baseUrl: string,
  ): Promise<{ url: string; filename: string }> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const uniqueSuffix = randomUUID();
    const ext = extname(file.originalname);
    const filename = `${uniqueSuffix}${ext}`;

    if (this.bucket) {
      try {
        const gcsFile = this.bucket.file(filename);
        await gcsFile.save(file.buffer, {
          contentType: file.mimetype,
          resumable: false,
        });

        // Try to make public (ignores error if bucket configuration blocks ACL/public-read explicitly)
        try {
          await gcsFile.makePublic();
        } catch (aclError) {
          const msg =
            aclError instanceof Error ? aclError.message : String(aclError);
          this.logger.warn(
            `Could not make GCS file public via API (this is normal if Uniform Bucket Access is enabled): ${msg}`,
          );
        }

        const url = `https://storage.googleapis.com/${this.gcsBucketName}/${filename}`;
        this.logger.log(`File uploaded to GCS successfully: ${filename}`);
        return { url, filename };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `Failed to upload file to GCS: ${msg}. Falling back to local storage.`,
        );
        return this.saveToLocal(file, filename, baseUrl);
      }
    } else {
      return this.saveToLocal(file, filename, baseUrl);
    }
  }

  async handleMultipleFilesUpload(
    files: Express.Multer.File[],
    baseUrl: string,
  ): Promise<string[]> {
    const urls: string[] = [];
    for (const file of files) {
      const res = await this.handleFileUpload(file, baseUrl);
      urls.push(res.url);
    }
    return urls;
  }

  private async saveToLocal(
    file: Express.Multer.File,
    filename: string,
    baseUrl: string,
  ): Promise<{ url: string; filename: string }> {
    if (!existsSync(this.uploadPath)) {
      mkdirSync(this.uploadPath, { recursive: true });
    }
    const filepath = join(this.uploadPath, filename);
    await fsPromises.writeFile(filepath, file.buffer);
    const url = `${baseUrl}/uploads/${filename}`;
    this.logger.log(`File saved locally successfully: ${filename}`);
    return { url, filename };
  }

  async deleteFile(url: string): Promise<void> {
    if (!url) {
      throw new BadRequestException('URL is required for deletion');
    }

    const parts = url.split('/');
    const filename = parts[parts.length - 1];

    if (this.bucket && url.includes('storage.googleapis.com')) {
      try {
        const gcsFile = this.bucket.file(filename);
        await gcsFile.delete();
        this.logger.log(`File deleted from GCS: ${filename}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(`Failed to delete file from GCS: ${msg}`);
        throw new BadRequestException(`Could not delete file from GCS: ${msg}`);
      }
    } else {
      const filepath = join(this.uploadPath, filename);
      if (existsSync(filepath)) {
        try {
          await fsPromises.unlink(filepath);
          this.logger.log(`Local file deleted: ${filename}`);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          this.logger.error(`Failed to delete local file: ${msg}`);
          throw new BadRequestException(`Could not delete local file: ${msg}`);
        }
      } else {
        this.logger.warn(`File not found for deletion: ${filename}`);
        throw new BadRequestException(`File ${filename} not found on server`);
      }
    }
  }
}
