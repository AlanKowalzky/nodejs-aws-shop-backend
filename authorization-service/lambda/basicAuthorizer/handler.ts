import { APIGatewayTokenAuthorizerEvent, APIGatewayAuthorizerResult, Context, StatementEffect } from 'aws-lambda';

export const handler = async (
  event: APIGatewayTokenAuthorizerEvent,
  context: Context
): Promise<APIGatewayAuthorizerResult> => {
  console.log('Event: ', JSON.stringify(event));

  const authorizationToken = event.authorizationToken;

  if (!authorizationToken) {
    console.log('No authorization token provided');
    throw new Error('Unauthorized'); // Returns 401
  }

  try {
    const [type, encodedToken] = authorizationToken.split(' ');

    if (type !== 'Basic' || !encodedToken) {
      console.log('Invalid token type or missing encoded token');
      throw new Error('Unauthorized');
    }

    const buff = Buffer.from(encodedToken, 'base64');
    const decodedToken = buff.toString('utf-8');
    const [username, password] = decodedToken.split(':');

    console.log(`Username: ${username}, Password: ${password}`);

    const storedPassword = process.env[username];
    const effect: StatementEffect = storedPassword && storedPassword === password ? 'Allow' : 'Deny';

    const policy = generatePolicy(username, effect, event.methodArn);

    console.log('Generated policy: ', JSON.stringify(policy));
    return policy;
  } catch (error) {
    console.error('Error during authorization: ', error);
    throw new Error('Unauthorized');
  }
};

const generatePolicy = (
  principalId: string,
  effect: StatementEffect,
  resource: string
): APIGatewayAuthorizerResult => {
  return {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource,
        },
      ],
    },
  };
};
