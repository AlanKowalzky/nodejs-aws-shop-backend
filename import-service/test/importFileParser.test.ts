import { Readable } from 'stream';

const mockSend = jest.fn();
jest.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: jest.fn().mockImplementation(() => ({
      send: mockSend,
    })),
    GetObjectCommand: jest.fn().mockImplementation((args) => args),
    CopyObjectCommand: jest.fn().mockImplementation((args) => args),
    DeleteObjectCommand: jest.fn().mockImplementation((args) => args),
  };
});

import { handler } from '../lambda/importFileParser/handler';

type S3Event = {
  Records: Array<{
    s3: {
      bucket: { name: string };
      object: { key: string };
    };
  }>;
};

describe('importFileParser handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockReset();
    process.env.BUCKET_NAME = 'test-bucket';
  });

  it('should process S3 event and stream file records successfully', async () => {
    const event: Partial<S3Event> = {
      Records: [
        {
          s3: {
            bucket: { name: 'test-bucket' },
            object: { key: 'uploaded/test.csv' },
          },
        } as any,
      ],
    };

    const mockStream = new Readable();
    mockStream.push('id,title,price\n1,Product A,10\n2,Product B,20');
    mockStream.push(null);

    mockSend.mockResolvedValue({
      Body: mockStream,
    });

    const result = await handler(event as S3Event);
    expect(result.statusCode).toBe(200);
    expect(result.body).toBe('OK');
  });

  it('should return 500 if BUCKET_NAME is not set', async () => {
    delete process.env.BUCKET_NAME;
    const event: Partial<S3Event> = { Records: [] };

    const result = await handler(event as S3Event);
    
    expect(result.statusCode).toBe(500);
    expect(result.body).toBe('Internal server error');
  });
});
