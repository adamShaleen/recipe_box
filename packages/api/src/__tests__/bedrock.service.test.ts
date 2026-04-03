import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { mockClient } from 'aws-sdk-client-mock';
import * as sut from '../services/bedrock.service';

describe('bedrock service', () => {
  const bedrockMock = mockClient(BedrockRuntimeClient);

  beforeEach(() => {
    jest.clearAllMocks();
    bedrockMock.reset();
  });

  describe('generateEmbedding', () => {
    const embedding = new Array(1526).fill(0.1);
    let result: any;

    beforeEach(async () => {
      bedrockMock.on(InvokeModelCommand).resolves({
        body: Buffer.from(JSON.stringify({ embedding }))
      } as any);

      result = await sut.generateEmbedding('mock input text');
    });

    it('invokes the model', () => {
      expect(bedrockMock.calls()).toHaveLength(1);

      expect(bedrockMock.commandCalls(InvokeModelCommand)[0]!.args[0].input).toMatchObject({
        modelId: 'amazon.titan-embed-text-v1'
      });
    });

    it('returns the embedding', () => {
      expect(result).toEqual(embedding);
    });
  });

  describe('invokeHaiku', () => {
    let result: any;

    beforeEach(async () => {
      bedrockMock.on(InvokeModelCommand).resolves({
        body: Buffer.from(
          JSON.stringify({
            content: [{ text: JSON.stringify({ id: 'mock-id', name: 'mock-recipe' }) }]
          })
        )
      } as any);

      result = await sut.invokeHaiku('mock prompt');
    });

    it('invokes the model', () => {
      expect(bedrockMock.calls()).toHaveLength(1);
      expect(bedrockMock.commandCalls(InvokeModelCommand)[0]!.args[0].input).toStrictEqual({
        accept: 'application/json',
        body: '{"anthropic_version":"bedrock-2023-05-31","max_tokens":2048,"messages":[{"role":"user","content":"mock prompt"}]}',
        contentType: 'application/json',
        modelId: 'anthropic.claude-3-haiku-20240307-v1:0'
      });
    });

    it('returns the Recipe', () => {
      expect(result).toEqual({ id: 'mock-id', name: 'mock-recipe' });
    });
  });
});
