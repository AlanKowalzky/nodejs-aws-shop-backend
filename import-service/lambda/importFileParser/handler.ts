import { S3Client, GetObjectCommand, CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import csvParser from "csv-parser";
import { Readable } from "stream";

export const handler = async (event: any) => {
  console.log('Received S3 event:', JSON.stringify(event, null, 2));

  const s3Client = new S3Client({});
  const bucketName = process.env.BUCKET_NAME;

  if (!bucketName) {
    console.error('BUCKET_NAME environment variable is not set');
    return { statusCode: 500, body: 'Internal server error' };
  }

  try {
    // Process each record in the event (S3 can batch multiple records)
    for (const record of event.Records) {
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
      console.log(`Processing file: ${key}`);

      // Get the object from S3
      const getObjectParams = {
        Bucket: bucketName,
        Key: key,
      };
      const getObjectCommand = new GetObjectCommand(getObjectParams);
      const getObjectResponse = await s3Client.send(getObjectCommand);

      if (!getObjectResponse.Body) {
        console.warn(`No body found for object ${key}`);
        continue;
      }

      // Create a readable stream from the object body
      const readableStream = getObjectResponse.Body as Readable;

      // Parse CSV and log each record
      const records: any[] = [];
      await new Promise<void>((resolve, reject) => {
        readableStream
          .pipe(csvParser({ headers: true, skipEmptyLines: true }))
          .on('data', (data) => {
            console.log('CSV record:', data);
            records.push(data);
          })
          .on('end', () => {
            console.log(`Finished parsing CSV file ${key}. Total records: ${records.length}`);
            resolve();
          })
          .on('error', (error) => {
            console.error(`Error parsing CSV file ${key}:`, error);
            reject(error);
          });
      });

      // Optional: Move the file to the parsed folder and delete from uploaded
      const parsedKey = key.replace(/^uploaded\//, 'parsed/');
      console.log(`Moving file from ${key} to ${parsedKey}`);

      // Copy the object to the parsed folder
      const copyObjectParams = {
        Bucket: bucketName,
        CopySource: `${bucketName}/${key}`,
        Key: parsedKey,
      };
      const copyObjectCommand = new CopyObjectCommand(copyObjectParams);
      await s3Client.send(copyObjectCommand);

      // Delete the original object from the uploaded folder
      const deleteObjectParams = {
        Bucket: bucketName,
        Key: key,
      };
      const deleteObjectCommand = new DeleteObjectCommand(deleteObjectParams);
      await s3Client.send(deleteObjectCommand);

      console.log(`Successfully moved file ${key} to ${parsedKey}`);
    }

    return { statusCode: 200, body: 'OK' };
  } catch (error) {
    console.error('Error processing S3 event:', error);
    return { statusCode: 500, body: 'Internal server error' };
  }
};