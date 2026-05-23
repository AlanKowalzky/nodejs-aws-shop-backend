import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { SQSEvent, SQSHandler, Context } from "aws-lambda";
import { randomUUID } from "node:crypto";

const ddbClient = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
const snsClient = new SNSClient({});

export const handler: SQSHandler = async (event: SQSEvent, _context: Context) => {
  console.log('Received SQS event:', JSON.stringify(event, null, 2));

  const productsTable = process.env.PRODUCTS_TABLE;
  const stocksTable = process.env.STOCKS_TABLE;
  const createProductTopicArn = process.env.CREATE_PRODUCT_TOPIC_ARN;

  if (!productsTable || !stocksTable) {
    throw new Error("Missing table names in environment variables");
  }

  for (const record of event.Records) {
    try {
      const productData = JSON.parse(record.body);
      console.log('Processing product data:', productData);

      const { title, description, price, count } = productData;

      // Validate input data
      if (!title || typeof price !== 'number' || typeof count !== 'number' || price < 0 || count < 0) {
        console.error('Invalid product data:', productData);
        continue; // Skip invalid records but continue processing others
      }

      const id = randomUUID();

      // Write product to products table
      await ddbDocClient.send(new PutCommand({
        TableName: productsTable,
        Item: { id, title, description, price }
      }));

      // Write stock to stocks table
      await ddbDocClient.send(new PutCommand({
        TableName: stocksTable,
        Item: { product_id: id, count }
      }));

      console.log(`Successfully created product with id: ${id}`);

      // Publish to SNS topic if ARN is provided
      if (createProductTopicArn) {
        const snsMessage = {
          eventType: 'productCreated',
          productId: id,
          title,
          description,
          price,
          count,
          timestamp: new Date().toISOString()
        };

        await snsClient.send(new PublishCommand({
          TopicArn: createProductTopicArn,
          Message: JSON.stringify(snsMessage),
          Subject: 'New Product Created',
          MessageAttributes: {
            price: {
              DataType: 'Number',
              StringValue: String(price),
            },
          },
        }));

        console.log(`Published product creation event to SNS for productId: ${id}`);
      }

    } catch (error) {
      console.error('Error processing SQS record:', error);
      // Continue processing other records even if one fails
      continue;
    }
  }

};