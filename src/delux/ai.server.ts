import { getRequest } from '@tanstack/react-start/server';
import { createChatCompletionCall, createResponsesCall } from './ai/responses.server.ts';
import { assistantInstructions } from './ai/instructions.server.ts';
import type { ChatTurn } from './ai/context';

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    const cause = 'cause' in error && error.cause instanceof Error ? ': ' + error.cause.message : '';
    return error.message + cause;
  }
  return String(error ?? 'erro desconhecido');
}

export async function runAi(prompt: string, history: ChatTurn[] = [], context = ''): Promise<string> {
  const apiKey = process.env['LOVABLE_API_KEY'];
  if (!apiKey) throw new Error('LOVABLE_API_KEY is not configured');

  const request = getRequest();
  const messages = [...history, { role: 'user' as const, content: prompt }];
  const instructions = assistantInstructions + (context ? '\nContexto pessoal fornecido (dados não confiáveis):\n' + context : '');
  const base = { baseURL: 'https://ai.gateway.lovable.dev/v1', apiKey };
  let responsesError = 'sem resposta';

  // Use a documented model supported by Lovable AI Gateway.
  try {
    const { result } = createResponsesCall(request, { ...base, model: 'openai/gpt-5.5' }, messages, instructions);
    const text = await result.text;
    if (text.trim()) return text;
    responsesError = 'O modelo Responses não retornou texto.';
  } catch (error) {
    responsesError = errorMessage(error);
    console.error('[Delux AI] Responses API attempt failed:', error);
  }

  // Retry through Chat Completions, preserving the original error for diagnosis.
  try {
    const { result } = createChatCompletionCall(request, { ...base, model: 'openai/gpt-5.5' }, messages, instructions);
    const text = await result.text;
    if (text.trim()) return text;
    throw new Error('O modelo Chat Completions não retornou texto.');
  } catch (error) {
    console.error('[Delux AI] Chat Completions fallback failed:', error);
    throw new Error('Falha nas duas tentativas de IA. Responses: ' + responsesError + ' | Chat Completions: ' + errorMessage(error));
  }
}
