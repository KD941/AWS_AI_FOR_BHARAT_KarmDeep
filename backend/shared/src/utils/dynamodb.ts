import { DynamoDB } from 'aws-sdk';

const dynamodb = new DynamoDB.DocumentClient();
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'KarmDeepMainTable';

export interface DynamoDBItem {
  PK: string;
  SK: string;
  [key: string]: any;
}

export class DynamoDBService {
  /**
   * Put item into DynamoDB
   */
  static async putItem(item: DynamoDBItem): Promise<void> {
    await dynamodb.put({
      TableName: TABLE_NAME,
      Item: item
    }).promise();
  }

  /**
   * Get item from DynamoDB
   */
  static async getItem(PK: string, SK: string): Promise<DynamoDBItem | null> {
    const result = await dynamodb.get({
      TableName: TABLE_NAME,
      Key: { PK, SK }
    }).promise();

    return result.Item as DynamoDBItem || null;
  }

  /**
   * Query items by partition key
   */
  static async query(
    PK: string,
    SKCondition?: string,
    limit?: number,
    exclusiveStartKey?: any
  ): Promise<{ items: DynamoDBItem[]; lastEvaluatedKey?: any }> {
    const params: DynamoDB.DocumentClient.QueryInput = {
      TableName: TABLE_NAME,
      KeyConditionExpression: SKCondition ? 'PK = :pk AND ' + SKCondition : 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': PK
      },
      Limit: limit,
      ExclusiveStartKey: exclusiveStartKey
    };

    const result = await dynamodb.query(params).promise();

    return {
      items: result.Items as DynamoDBItem[] || [],
      lastEvaluatedKey: result.LastEvaluatedKey
    };
  }

  /**
   * Update item in DynamoDB
   */
  static async updateItem(
    PK: string,
    SK: string,
    updates: Record<string, any>
  ): Promise<DynamoDBItem> {
    const updateExpression: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    Object.keys(updates).forEach((key, index) => {
      const attrName = `#attr${index}`;
      const attrValue = `:val${index}`;
      updateExpression.push(`${attrName} = ${attrValue}`);
      expressionAttributeNames[attrName] = key;
      expressionAttributeValues[attrValue] = updates[key];
    });

    const result = await dynamodb.update({
      TableName: TABLE_NAME,
      Key: { PK, SK },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    }).promise();

    return result.Attributes as DynamoDBItem;
  }

  /**
   * Delete item from DynamoDB
   */
  static async deleteItem(PK: string, SK: string): Promise<void> {
    await dynamodb.delete({
      TableName: TABLE_NAME,
      Key: { PK, SK }
    }).promise();
  }

  /**
   * Batch write items
   */
  static async batchWrite(items: DynamoDBItem[]): Promise<void> {
    const chunks = this.chunkArray(items, 25); // DynamoDB batch limit

    for (const chunk of chunks) {
      await dynamodb.batchWrite({
        RequestItems: {
          [TABLE_NAME]: chunk.map(item => ({
            PutRequest: { Item: item }
          }))
        }
      }).promise();
    }
  }

  /**
   * Helper to chunk array
   */
  private static chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
