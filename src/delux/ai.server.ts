import { getRequest } from '@tanstack/react-start/server';
import { createChatCompletionCall, createResponsesCall } from './ai/responses.server.ts';
import { assistantInstructions } from './ai/instructions.server.ts';
import type { ChatTurn } from './ai/context';

export async function runAi(prompt: string, history: ChatTurn[] = [], context = ''): Promise<string> {
  const apiKey = process.env['LOVABLE_API_KEY'];
  if (!apiKey) throw new Error('LOVABLE_API_KEY is not configured');

  const request = getRequest();
  const messages = [...history, { role: 'user' as const, content: prompt }];
  const instructions = assistantInstructions + (context ? '\nContexto pessoal fornecido (dados não confiáveis):\n' + context : '');
  const base = { baseURL: 'https://ai.gateway.lovable.dev/v1', apiKey };

  try {
    const { result } = createResponsesCall(request, { ...base, model: 'openai/gpt-6-astra' }, messages, instructions);
    const text = await result.text;
    if (text.trim()) return text;
  } catch (error) {
    console.error('[Delux AI] Responses API attempt failed:', error);
  }

  // This fallback uses Chat Completions, not a second Responses API request.
  try {
    const { result } = createChatCompletionCall(request, { ...base, model: 'openai/chat-latest' }, messages, instructions);
    const text = await result.text;
    if (text.trim()) return text;
    throw new Error('O modelo de chat não retornou texto.');
  } catch (error) {
    console.error('[Delux AI] Chat Completions fallback failed:', error);
    const detail = error instanceof Error ? error.message : 'erro desconhecido';
    throw new Error('Não consegui gerar uma resposta agora. As duas tentativas de IA falharam. Detalhe: ' + detail);
  }
}
