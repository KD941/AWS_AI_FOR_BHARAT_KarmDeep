import { S3 } from 'aws-sdk';

const s3 = new S3();

export class S3Service {
  /**
   * Generate presigned URL for upload
   */
  static async getUploadUrl(
    bucket: string,
    key: string,
    contentType: string,
    expiresIn: number = 3600
  ): Promise<string> {
    return s3.getSignedUrlPromise('putObject', {
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      Expires: expiresIn
    });
  }

  /**
   * Generate presigned URL for download
   */
  static async getDownloadUrl(
    bucket: string,
    key: string,
    expiresIn: number = 3600
  ): Promise<string> {
    return s3.getSignedUrlPromise('getObject', {
      Bucket: bucket,
      Key: key,
      Expires: expiresIn
    });
  }

  /**
   * Upload file to S3
   */
  static async uploadFile(
    bucket: string,
    key: string,
    body: Buffer | string,
    contentType?: string
  ): Promise<void> {
    await s3.putObject({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      ServerSideEncryption: 'AES256'
    }).promise();
  }

  /**
   * Delete file from S3
   */
  static async deleteFile(bucket: string, key: string): Promise<void> {
    await s3.deleteObject({
      Bucket: bucket,
      Key: key
    }).promise();
  }

  /**
   * Copy file within S3
   */
  static async copyFile(
    sourceBucket: string,
    sourceKey: string,
    destBucket: string,
    destKey: string
  ): Promise<void> {
    await s3.copyObject({
      CopySource: `${sourceBucket}/${sourceKey}`,
      Bucket: destBucket,
      Key: destKey
    }).promise();
  }

  /**
   * List files in bucket
   */
  static async listFiles(
    bucket: string,
    prefix?: string,
    maxKeys: number = 1000
  ): Promise<string[]> {
    const result = await s3.listObjectsV2({
      Bucket: bucket,
      Prefix: prefix,
      MaxKeys: maxKeys
    }).promise();

    return result.Contents?.map(obj => obj.Key!) || [];
  }
}
