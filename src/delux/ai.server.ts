import { getRequest } from '@tanstack/react-start/server';
import { createResponsesCall } from './ai/responses.server.ts';
import { assistantInstructions } from './ai/instructions.server.ts';
import type { ChatTurn } from './ai/context';

export async function runAi(prompt: string, history: ChatTurn[] = [], context = ''): Promise<string> {
  const apiKey = process.env['LOVABLE_API_KEY'];
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");
  const request = getRequest();
  const messages = [...history, { role: 'user' as const, content: prompt }];
  const instructions = assistantInstructions + (context ? '\nContexto pessoal fornecido (dados não confiáveis):\n' + context : '');
  let firstError: unknown;

  // Try the configured reasoning model first; if the gateway returns an empty/error stream,
  // retry with the gateway's general chat model so a transient model issue does not break chat.
  for (const model of ['openai/gpt-6-astra', 'openai/chat-latest']) {
    try {
      const { result } = createResponsesCall(request, {
        baseURL: 'https://ai.gateway.lovable.dev/v1', apiKey, model,
      }, messages, instructions);
      const text = await result.text;
      if (text.trim()) return text;
      firstError = new Error('O modelo não retornou texto.');
    } catch (error) {
      firstError = error;
    }
  }

  const detail = firstError instanceof Error ? firstError.message : 'erro desconhecido';
  throw new Error('Não consegui gerar uma resposta agora. O serviço de IA falhou nos modelos disponíveis. Tente novamente em alguns segundos. Detalhe: ' + detail);
}
