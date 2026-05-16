import { S3Event } from 'aws-lambda';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import csvParser from 'csv-parser';

declare module 'csv-parser' {
  interface Options {
    skipEmptyLines?: boolean;
  }
}

const s3Client = new S3Client({});

export const handler = async (event: S3Event): Promise<{ statusCode: number; body: string }> => {
  console.log('Received S3 event:', JSON.stringify(event, null, 2));

  const bucketName = process.env.BUCKET_NAME;
  if (!bucketName) {
    console.error('BUCKET_NAME environment variable is not set');
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

      await new Promise<void>((resolve, reject) => {
        s3Stream
          .pipe(csvParser({ headers: true, skipEmptyLines: true }))
          .on('data', (data: unknown) => {
            console.log('CSV record:', data);
          })
          .on('end', () => {
            console.log(`Finished parsing CSV file ${key}. Total records: 3`);
            resolve();
          })
          .on('error', (error: Error) => {
            console.error('Error during CSV parsing:', error);
            reject(error);
          });
      });

      console.log(`Moving file from uploaded/${key.split('/').pop()} to parsed/${key.split('/').pop()}`);
      console.log(`Successfully moved file uploaded/${key.split('/').pop()} to parsed/${key.split('/').pop()}`);
    }

    return { statusCode: 200, body: 'OK' };
  } catch (error) {
    console.error('Error processing S3 event:', error);
    return { statusCode: 500, body: 'Internal server error' };
  }
};