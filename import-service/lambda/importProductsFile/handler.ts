import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const handler = async (event: any) => {
  try {
    console.log('Received event:', JSON.stringify(event, null, 2));

    // Extract filename from query string parameters
    const queryParams = event.queryStringParameters || {};
    const fileName = queryParams.name;

    if (!fileName) {
      return {
        statusCode: 400,
        body: 'Missing required query parameter: name'
      };
    }

    // Validate filename (basic validation)
    if (fileName.includes('..') || fileName.startsWith('/')) {
      return {
        statusCode: 400,
        body: 'Invalid filename'
      };
    }

    const bucketName = process.env.BUCKET_NAME;
    if (!bucketName) {
      console.error('BUCKET_NAME environment variable is not set');
      return {
        statusCode: 500,
        body: 'Internal server error'
      };
    }

    const s3Client = new S3Client({});

    const key = `uploaded/${fileName}`;

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    // Generate a presigned URL valid for 15 minutes (900 seconds)
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

    console.log(`Generated signed URL for key: ${key}`);

    return {
      statusCode: 200,
      body: signedUrl,
      // Important: Return as plain text, not JSON
      headers: {
        'Content-Type': 'text/plain'
      }
    };
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return {
      statusCode: 500,
      body: 'Internal server error'
    };
  }
};