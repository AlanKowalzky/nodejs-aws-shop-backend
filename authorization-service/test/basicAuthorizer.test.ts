import { APIGatewayTokenAuthorizerEvent, Context } from 'aws-lambda';
import { handler } from '../lambda/basicAuthorizer/handler';

describe('basicAuthorizer handler', () => {
  const mockContext = {} as Context;

  beforeEach(() => {
    process.env.alankowalzky = 'TEST_PASSWORD';
  });

  afterEach(() => {
    delete process.env.alankowalzky;
  });

  it('should return Allow policy for correct credentials', async () => {
    const event: APIGatewayTokenAuthorizerEvent = {
      type: 'TOKEN',
      authorizationToken: 'Basic YWxhbmtvd2Fsemt5OlRFU1RfUEFTU1dPUkQ=', // alankowalzky:TEST_PASSWORD
      methodArn: 'arn:aws:execute-api:us-east-1:123456789012:apiId/stage/GET/import',
    };

    const result = await handler(event, mockContext);

    expect(result.policyDocument.Statement[0].Effect).toBe('Allow');
    expect(result.principalId).toBe('alankowalzky');
  });

  it('should return Deny policy for incorrect credentials', async () => {
    const event: APIGatewayTokenAuthorizerEvent = {
      type: 'TOKEN',
      authorizationToken: 'Basic am9obmRvZTpXUk9OR19QQVNTV09SRA==', // johndoe:WRONG_PASSWORD
      methodArn: 'arn:aws:execute-api:us-east-1:123456789012:apiId/stage/GET/import',
    };

    const result = await handler(event, mockContext);

    expect(result.policyDocument.Statement[0].Effect).toBe('Deny');
  });

  it('should throw Unauthorized for missing token', async () => {
    const event: any = {
      type: 'TOKEN',
      methodArn: 'arn:aws:execute-api:us-east-1:123456789012:apiId/stage/GET/import',
    };

    await expect(handler(event, mockContext)).rejects.toThrow('Unauthorized');
  });

  it('should throw Unauthorized for invalid token format', async () => {
    const event: APIGatewayTokenAuthorizerEvent = {
      type: 'TOKEN',
      authorizationToken: 'InvalidFormat',
      methodArn: 'arn:aws:execute-api:us-east-1:123456789012:apiId/stage/GET/import',
    };

    await expect(handler(event, mockContext)).rejects.toThrow('Unauthorized');
  });
});
