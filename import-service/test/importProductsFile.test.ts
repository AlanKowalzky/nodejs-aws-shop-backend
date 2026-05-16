import { Handler } from 'aws-lambda';
import { handler } from '../lambda/importProductsFile/handler';

describe('importProductsFile handler', () => {
  const mockSend = jest.fn();
  const mockGetSignedUrl = jest.fn();

  // Mock the S3Client and getSignedUrl
  const mockS3Client = {
    send: mockSend,
  };

  // Mock the getSignedUrl function from @aws-sdk/s3-request-presigner
  jest.mock('@aws-sdk/s3-request-presigner', () => ({
    getSignedUrl: mockGetSignedUrl,
  }));

  // Mock the S3Client constructor
  jest.mock('@aws-sdk/client-s3', () => {
    return { S3Client: jest.fn(() => mockS3Client) };
  });

  beforeEach(() => {
    mockSend.mockReset();
    mockGetSignedUrl.mockReset();
    process.env.BUCKET_NAME = 'test-bucket';
  });

  it('should return a signed URL when name parameter is provided', async () => {
    const event = {
      queryStringParameters: {
        name: 'test.csv',
      },
    };

    mockGetSignedUrl.mockResolvedValue('https://signed-url.example.com');

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    expect(result.headers['Content-Type']).toBe('text/plain');
    expect(result.body).toBe('https://signed-url.example.com');
    expect(mockGetSignedUrl).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        expiresIn: 900,
      })
    );
  });

  it('should return 400 when name parameter is missing', async () => {
    const event = {
      queryStringParameters: {},
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    expect(result.body).toBe('Missing required query parameter: name');
  });

  it('should return 400 when name parameter is empty string', async () => {
    const event = {
      queryStringParameters: {
        name: '',
      },
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    expect(result.body).toBe('Missing required query parameter: name');
  });

  it('should return 500 when BUCKET_NAME is not set', async () => {
    delete process.env.BUCKET_NAME;
    const event = {
      queryStringParameters: {
        name: 'test.csv',
      },
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(500);
    expect(result.body).toBe('Internal server error');
  });

  it('should return 500 when an error occurs', async () => {
    const event = {
      queryStringParameters: {
        name: 'test.csv',
      },
    };

    mockGetSignedUrl.mockRejectedValue(new Error('Test error'));

    const result = await handler(event);

    expect(result.statusCode).toBe(500);
    expect(result.body).toBe('Internal server error');
  });
});