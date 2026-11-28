import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { extname } from 'path';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'demo-access-key-id',
        secretAccessKey:
          process.env.AWS_SECRET_ACCESS_KEY || 'demo-secret-access-key',
      },
      endpoint: process.env.AWS_S3_ENDPOINT || undefined,
      forcePathStyle: process.env.AWS_S3_FORCE_PATH_STYLE === 'true',
    });
    this.bucketName = process.env.AWS_S3_BUCKET || 'hrms-uploads-bucket';
  }

  /**
   * S-11: Detect mock mode and forbid mock mode when NODE_ENV=production
   */
  private isMockMode(): boolean {
    const isMock =
      process.env.AWS_S3_MOCK === 'true' ||
      process.env.AWS_ACCESS_KEY_ID === 'demo-access-key-id' ||
      !process.env.AWS_ACCESS_KEY_ID;

    if (isMock && process.env.NODE_ENV === 'production') {
      throw new InternalServerErrorException(
        'AWS S3 Mock mode or demo credentials are not permitted in production. Configure real AWS credentials.',
      );
    }

    return isMock;
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'uploads',
  ): Promise<string> {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename = `${folder}/${uniqueSuffix}${extname(file.originalname)}`;

    // Fallback: If mock mode is explicitly turned on or demo keys are detected, simulate the upload
    if (this.isMockMode()) {
      console.log(
        `[S3 Mock] Successfully simulated file upload for ${file.originalname} to bucket ${this.bucketName} as ${filename}`,
      );
      return `https://${this.bucketName}.s3.amazonaws.com/${filename}`;
    }

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: filename,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );

      const endpoint = process.env.AWS_S3_ENDPOINT;
      if (endpoint) {
        return `${endpoint}/${this.bucketName}/${filename}`;
      }
      return `https://${this.bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${filename}`;
    } catch (error) {
      console.error('AWS S3 Upload Error:', error);
      throw error;
    }
  }

  // Generate a secure, temporary viewing link (Valid for 15 mins)
  async getPresignedUrl(fileKey: string): Promise<string> {
    if (!fileKey) return '';

    if (this.isMockMode()) {
      return fileKey;
    }

    let key = fileKey;
    if (fileKey.startsWith('http')) {
      try {
        const url = new URL(fileKey);
        const pathname = url.pathname;
        const bucketPrefix = `/${this.bucketName}/`;
        if (pathname.startsWith(bucketPrefix)) {
          key = pathname.substring(bucketPrefix.length);
        } else {
          key = pathname.startsWith('/') ? pathname.substring(1) : pathname;
        }
      } catch (err) {
        console.error('Failed to parse fileUrl as URL:', err);
      }
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      // URL expires in 900 seconds (15 minutes)
      return await getSignedUrl(this.s3Client, command, { expiresIn: 900 });
    } catch (error) {
      console.error(
        'Failed to generate pre-signed URL, returning original link:',
        error,
      );
      return fileKey;
    }
  }

  // Delete file from S3 / MinIO
  async deleteFile(fileKey: string): Promise<void> {
    if (!fileKey) return;

    if (this.isMockMode()) {
      console.log(`[S3 Mock] Simulated file deletion for key ${fileKey}`);
      return;
    }

    let key = fileKey;
    if (fileKey.startsWith('http')) {
      try {
        const url = new URL(fileKey);
        const pathname = url.pathname;
        const bucketPrefix = `/${this.bucketName}/`;
        if (pathname.startsWith(bucketPrefix)) {
          key = pathname.substring(bucketPrefix.length);
        } else {
          key = pathname.startsWith('/') ? pathname.substring(1) : pathname;
        }
      } catch (err) {
        console.error('Failed to parse fileUrl for deletion:', err);
      }
    }

    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );
      console.log(`[S3] Successfully deleted S3 file for key: ${key}`);
    } catch (error) {
      console.error('Failed to delete S3 file:', error);
      throw error;
    }
  }
}
