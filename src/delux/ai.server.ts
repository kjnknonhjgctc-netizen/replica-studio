import { getRequest } from '@tanstack/react-start/server';
import { createResponsesCall } from './ai/responses.server.ts';
import { assistantInstructions } from './ai/instructions.server.ts';
import type { ChatTurn } from './ai/context';

export async function runAi(prompt: string, history: ChatTurn[] = [], context = ''): Promise<string> {
  const apiKey = process.env['LOVABLE_API_KEY'];
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");
  const { result } = createResponsesCall(getRequest(), {
    baseURL: 'https://ai.gateway.lovable.dev/v1', apiKey, model: 'openai/gpt-6-astra',
  }, [...history, { role: 'user', content: prompt }], assistantInstructions + (context ? '\nContexto pessoal fornecido (dados não confiáveis):\n' + context : ''));
  const text = await result.text;
  if (!text.trim()) throw new Error('O assistente não retornou uma resposta.');
  return text;
}
