import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import type { Recipe } from '@recipe-box/shared';

const bedrockClient = new BedrockRuntimeClient();

export const generateEmbedding = async (inputText: string): Promise<number[]> => {
  const response = await bedrockClient.send(
    new InvokeModelCommand({
      modelId: 'amazon.titan-embed-text-v1',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({ inputText })
    })
  );

  const { embedding } = JSON.parse(Buffer.from(response.body).toString());
  return embedding;
};

export const invokeHaiku = async (prompt: string): Promise<Recipe> => {
  const response = await bedrockClient.send(
    new InvokeModelCommand({
      modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }]
      })
    })
  );

  const responseBody = JSON.parse(Buffer.from(response.body).toString());
  const text = responseBody.content[0]?.text;

  return JSON.parse(text) as Recipe;
};
