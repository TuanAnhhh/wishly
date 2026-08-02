import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomBytes } from 'crypto';
import type { Readable } from 'stream';
import type { PresignRequest } from '@wishly/contracts';

@Injectable()
export class MediaService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(private readonly config: ConfigService) {
    const endpoint = config.getOrThrow<string>('S3_ENDPOINT');
    this.bucket = config.getOrThrow<string>('S3_BUCKET');
    this.publicUrl = config.getOrThrow<string>('S3_PUBLIC_URL');
    this.client = new S3Client({
      region: config.get('S3_REGION') ?? 'us-east-1',
      endpoint,
      forcePathStyle: config.get('S3_FORCE_PATH_STYLE') === 'true',
      credentials: {
        accessKeyId: config.getOrThrow<string>('S3_ACCESS_KEY_ID'),
        secretAccessKey: config.getOrThrow<string>('S3_SECRET_ACCESS_KEY'),
      },
    });
  }

  async createPresign(
    input: PresignRequest,
    ownerKey: string
  ): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
    const ext = input.filename.includes('.')
      ? input.filename.split('.').pop()
      : 'bin';
    const key = `${ownerKey}/${Date.now()}-${randomBytes(6).toString('hex')}.${ext}`;
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: input.contentType,
      ContentLength: input.byteSize,
    });
    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: 60 * 5,
    });
    return {
      uploadUrl,
      key,
      publicUrl: `${this.publicUrl}/${key}`,
    };
  }

  async putPublicObject(
    key: string,
    body: Buffer,
    contentType: string
  ): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
    );
    return key;
  }

  /** Absolute public URL for a stored object key */
  resolvePublicUrl(key: string): string {
    if (key.startsWith('http://') || key.startsWith('https://')) return key;
    return `${this.publicUrl.replace(/\/$/, '')}/${key}`;
  }

  /**
   * Album guest upload — forced key prefix `album/<invitationId>/`.
   * Caller must enforce album open + quota.
   */
  async createAlbumPresign(
    invitationId: string,
    input: Pick<PresignRequest, 'filename' | 'contentType' | 'byteSize'>
  ): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
    const ext = input.filename.includes('.')
      ? input.filename.split('.').pop()
      : 'jpg';
    const key = `album/${invitationId}/${Date.now()}-${randomBytes(6).toString('hex')}.${ext}`;
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: input.contentType,
      ContentLength: input.byteSize,
    });
    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: 60 * 5,
    });
    return {
      uploadUrl,
      key,
      publicUrl: this.resolvePublicUrl(key),
    };
  }

  async getObjectStream(key: string): Promise<Readable> {
    const res = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key })
    );
    return res.Body as Readable;
  }
}
