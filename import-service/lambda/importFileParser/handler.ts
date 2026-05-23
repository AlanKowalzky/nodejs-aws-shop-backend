import { S3Event } from 'aws-lambda';
import { S3Client, GetObjectCommand, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import csvParser from 'csv-parser';

declare module 'csv-parser' {
  interface Options {
    skipEmptyLines?: boolean;
  }
}

const s3Client = new S3Client({});
const sqsClient = new SQSClient({});

export const handler = async (event: S3Event): Promise<{ statusCode: number; body: string }> => {
  console.log('Received S3 event:', JSON.stringify(event, null, 2));

  const bucketName = process.env.BUCKET_NAME;
  const queueUrl = process.env.CATALOG_ITEMS_QUEUE_URL;

  if (!bucketName) {
    console.error('BUCKET_NAME environment variable is not set');
    return { statusCode: 500, body: 'Internal server error' };
  }

  if (!queueUrl) {
    console.error('CATALOG_ITEMS_QUEUE_URL environment variable is not set');
    return { statusCode: 500, body: 'Internal server error' };
  }

  try {
    for (const record of event.Records) {
      const bucket = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

      console.log(`Processing file: ${key}`);

      const s3Response = await s3Client.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: key,
        })
      );

      if (!s3Response.Body) {
        console.error('Empty response body from S3');
        continue;
      }

      const s3Stream = s3Response.Body as unknown as NodeJS.ReadableStream;

      const rows: unknown[] = [];
      await new Promise<void>((resolve, reject) => {
        s3Stream
          .pipe(csvParser({ headers: true, skipEmptyLines: true }))
          .on('data', (data: unknown) => rows.push(data))
          .on('end', () => resolve())
          .on('error', (error: Error) => reject(error));
      });

      for (const data of rows) {
        await sqsClient.send(
          new SendMessageCommand({
            QueueUrl: queueUrl,
            MessageBody: JSON.stringify(data),
          }),
        );
      }

      // Definiujemy nowy klucz dla folderu parsed/
      const fileName = key.split('/').pop();
      const parsedKey = `parsed/${fileName}`;

      console.log(`Moving file from ${key} to ${parsedKey}`);

      // 2. Kopiowanie pliku do folderu parsed/
      await s3Client.send(
        new CopyObjectCommand({
          Bucket: bucket,
          CopySource: `${bucket}/${key}`,
          Key: parsedKey,
        })
      );

      // 3. Usuwanie oryginalnego pliku z folderu uploaded/
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: key,
        })
      );

      console.log(`Successfully moved file ${key} to ${parsedKey}`);
    }

    return { statusCode: 200, body: 'OK' };
  } catch (error) {
    console.error('Error processing S3 event:', error);
    return { statusCode: 500, body: 'Internal server error' };
  }
};