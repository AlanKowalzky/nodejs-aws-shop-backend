import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const handler = async (event: Partial<APIGatewayProxyEvent>): Promise<APIGatewayProxyResult> => {
  try {
    console.log('Received event:', JSON.stringify(event, null, 2));

    const queryParams = event.queryStringParameters || {};
    const fileName = queryParams.name;

    const corsHeaders = {
      'Content-Type': 'text/plain',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'GET, PUT'
    };

    if (!fileName) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: 'Missing required query parameter: name'
      };
    }

    if (fileName.includes('..') || fileName.startsWith('/')) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: 'Invalid filename'
      };
    }

    const bucketName = process.env.BUCKET_NAME;
    if (!bucketName) {
      console.error('BUCKET_NAME environment variable is not set');
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: 'Internal server error'
      };
    }

    const s3Client = new S3Client({});
    const key = `uploaded/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: 'text/csv' 
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
    console.log(`Generated signed URL for key: ${key}`);

    return {
      statusCode: 200,
      body: signedUrl,
      headers: corsHeaders
    };
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*'
      },
      body: 'Internal server error'
    };
  }
};