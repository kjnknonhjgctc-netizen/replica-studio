import { createServerFn } from "@tanstack/react-start";
import { runAi } from "./ai.server";
import type { ChatTurn } from './ai/context';

export const generateAi = createServerFn({ method: "POST" })
  .inputValidator((input: { prompt: string; json?: boolean; history?: ChatTurn[]; context?: string }) => {
    if (typeof input?.prompt !== "string" || !input.prompt.trim() || input.prompt.length > 20000) {
      throw new Error("Prompt inválido.");
    }
    if (input.context && (typeof input.context !== 'string' || input.context.length > 20000)) throw new Error('Contexto inválido.');
    if (input.history && (!Array.isArray(input.history) || input.history.length > 12 || input.history.some(m => !['user', 'assistant'].includes(m.role) || typeof m.content !== 'string' || m.content.length > 3000))) throw new Error('Histórico inválido.');
    return { prompt: input.prompt, json: !!input.json, history: input.history || [], context: input.context || '' };
  })
  .handler(async ({ data }) => {
    let text = await runAi(data.prompt, data.history, data.context);
    if (data.json) {
      const m = text.match(/\{[\s\S]*\}/);
      text = m ? m[0] : text;
    }
    return { text };
  });

