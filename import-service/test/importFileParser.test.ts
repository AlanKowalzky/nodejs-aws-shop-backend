import { Handler } from 'aws-lambda';
import { handler } from '../lambda/importFileParser/handler';

describe('importFileParser handler', () => {
  const mockSend = jest.fn();

  // Mock the S3Client
  const mockS3Client = {
    send: mockSend,
  };

  // Mock the S3Client constructor
  jest.mock('@aws-sdk/client-s3', () => {
    return { S3Client: jest.fn(() => mockS3Client) };
  });

  // Mock csv-parser
  jest.mock('csv-parser', () => {
    return jest.fn().mockImplementation(() => {
      const { EventEmitter } = require('stream');
      const emitter = new EventEmitter();
      // Simulate piping
      emitter.pipe = jest.fn().mockReturnValue(emitter);
      emitter.on = jest.fn();
      return emitter;
    });
  });

  beforeEach(() => {
    mockSend.mockReset();
    process.env.BUCKET_NAME = 'test-bucket';
  });

  it('should process S3 event and move file to parsed folder', async () => {
    const event = {
      Records: [
        {
          s3: {
            bucket: {
              name: 'test-bucket',
            },
            object: {
              key: 'uploaded/test.csv',
            },
          },
        },
      ],
    };

    // Mock S3 responses: getObject, copyObject, deleteObject
    mockSend
      .mockResolvedValueOnce({ // getObject response
        Body: {
          pipe: jest.fn().mockReturnThis(),
          on: jest.fn(),
        } as any,
      })
      .mockResolvedValueOnce({}) // copyObject response
      .mockResolvedValueOnce({}); // deleteObject response

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    expect(result.body).toBe('OK');
    expect(mockSend).toHaveBeenCalledTimes(3); // getObject, copyObject, deleteObject
  });

  it('should handle multiple records in S3 event', async () => {
    const event = {
      Records: [
        {
          s3: {
            bucket: {
              name: 'test-bucket',
            },
            object: {
              key: 'uploaded/test1.csv',
            },
          },
        },
        {
          s3: {
            bucket: {
              name: 'test-bucket',
            },
            object: {
              key: 'uploaded/test2.csv',
            },
          },
        },
      ],
    };

    // Mock S3 responses for each record (getObject, copyObject, deleteObject)
    mockSend
      .mockResolvedValueOnce({ // getObject test1.csv
        Body: {
          pipe: jest.fn().mockReturnThis(),
          on: jest.fn(),
        } as any,
      })
      .mockResolvedValueOnce({}) // copyObject test1.csv
      .mockResolvedValueOnce({}) // deleteObject test1.csv
      .mockResolvedValueOnce({ // getObject test2.csv
        Body: {
          pipe: jest.fn().mockReturnThis(),
          on: jest.fn(),
        } as any,
      })
      .mockResolvedValueOnce({}) // copyObject test2.csv
      .mockResolvedValueOnce({}); // deleteObject test2.csv

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    expect(result.body).toBe('OK');
    expect(mockSend).toHaveBeenCalledTimes(6); // 2 records × 3 operations each
  });

  it('should return 500 when BUCKET_NAME is not set', async () => {
    delete process.env.BUCKET_NAME;
    const event = {
      Records: [
        {
          s3: {
            bucket: {
              name: 'test-bucket',
            },
            object: {
              key: 'uploaded/test.csv',
            },
          },
        },
      ],
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(500);
    expect(result.body).toBe('Internal server error');
  });

  it('should return 500 when an error occurs', async () => {
    const event = {
      Records: [
        {
          s3: {
            bucket: {
              name: 'test-bucket',
            },
            object: {
              key: 'uploaded/test.csv',
            },
          },
        },
      ],
    };

    mockSend.mockRejectedValueOnce(new Error('Test error'));

    const result = await handler(event);

    expect(result.statusCode).toBe(500);
    expect(result.body).toBe('Internal server error');
  });
});