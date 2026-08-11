import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { extname } from 'path';

@Injectable()
export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'demo-access-key-id',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'demo-secret-access-key',
      },
      endpoint: process.env.AWS_S3_ENDPOINT || undefined,
      forcePathStyle: process.env.AWS_S3_FORCE_PATH_STYLE === 'true',
    });
    this.bucketName = process.env.AWS_S3_BUCKET || 'hrms-uploads-bucket';
  }

  async uploadFile(file: Express.Multer.File, folder: string = 'uploads'): Promise<string> {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename = `${folder}/${uniqueSuffix}${extname(file.originalname)}`;

    // Fallback: If mock mode is explicitly turned on or demo keys are detected, simulate the upload
    if (
      process.env.AWS_S3_MOCK === 'true' ||
      process.env.AWS_ACCESS_KEY_ID === 'demo-access-key-id' ||
      !process.env.AWS_ACCESS_KEY_ID
    ) {
      console.log(`[S3 Mock] Successfully simulated file upload for ${file.originalname} to bucket ${this.bucketName} as ${filename}`);
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
}
