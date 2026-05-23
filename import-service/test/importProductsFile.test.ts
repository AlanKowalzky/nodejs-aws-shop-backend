const mockGetSignedUrl = jest.fn();

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: (...args: unknown[]) => mockGetSignedUrl(...args),
}));

jest.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: jest.fn().mockImplementation(() => ({
      send: jest.fn(),
    })),
    PutObjectCommand: jest.fn().mockImplementation((args) => args),
  };
});

import { handler } from '../lambda/importProductsFile/handler';
import { APIGatewayProxyEvent } from 'aws-lambda';

describe('importProductsFile handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSignedUrl.mockReset();
    process.env.BUCKET_NAME = 'test-bucket';
  });

  it('should return a signed URL when name parameter is provided', async () => {
    const event = {
      queryStringParameters: { name: 'test.csv' },
    };

    mockGetSignedUrl.mockResolvedValue('https://signed-url.example.com');

    const result = await handler(event as Partial<APIGatewayProxyEvent>);

    expect(result.statusCode).toBe(200);
    expect(result.body).toBe('https://signed-url.example.com');
  });

  it('should return 400 when name parameter is missing', async () => {
    const event = { queryStringParameters: {} };

    const result = await handler(event as Partial<APIGatewayProxyEvent>);

    expect(result.statusCode).toBe(400);
    expect(result.body).toBe('Missing required query parameter: name');
  });

  it('should return 400 when name parameter is empty string', async () => {
    const event = {
      queryStringParameters: { name: '' },
    };

    const result = await handler(event as Partial<APIGatewayProxyEvent>);

    expect(result.statusCode).toBe(400);
    expect(result.body).toBe('Missing required query parameter: name');
  });

  it('should return 500 when BUCKET_NAME is not set', async () => {
    delete process.env.BUCKET_NAME;
    const event = {
      queryStringParameters: { name: 'test.csv' },
    };

    const result = await handler(event as Partial<APIGatewayProxyEvent>);

    expect(result.statusCode).toBe(500);
    expect(result.body).toBe('Internal server error');
  });

  it('should return 500 when an error occurs', async () => {
    const event = {
      queryStringParameters: { name: 'test.csv' },
    };

    mockGetSignedUrl.mockRejectedValue(new Error('Test error'));

    const result = await handler(event as Partial<APIGatewayProxyEvent>);

    expect(result.statusCode).toBe(500);
    expect(result.body).toBe('Internal server error');
  });
});