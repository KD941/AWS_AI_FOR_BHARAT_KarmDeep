import { SNS } from 'aws-sdk';

const sns = new SNS();

export class SNSService {
  /**
   * Publish message to SNS topic
   */
  static async publish(
    topicArn: string,
    message: any,
    subject?: string,
    attributes?: Record<string, string>
  ): Promise<string> {
    const messageAttributes: Record<string, SNS.MessageAttributeValue> = {};
    
    if (attributes) {
      Object.keys(attributes).forEach(key => {
        messageAttributes[key] = {
          DataType: 'String',
          StringValue: attributes[key]
        };
      });
    }

    const result = await sns.publish({
      TopicArn: topicArn,
      Message: typeof message === 'string' ? message : JSON.stringify(message),
      Subject: subject,
      MessageAttributes: messageAttributes
    }).promise();

    return result.MessageId!;
  }

  /**
   * Publish batch messages
   */
  static async publishBatch(
    topicArn: string,
    messages: Array<{ id: string; message: any; subject?: string }>
  ): Promise<void> {
    const entries = messages.map(msg => ({
      Id: msg.id,
      Message: typeof msg.message === 'string' ? msg.message : JSON.stringify(msg.message),
      Subject: msg.subject
    }));

    await sns.publishBatch({
      TopicArn: topicArn,
      PublishBatchRequestEntries: entries
    }).promise();
  }
}
