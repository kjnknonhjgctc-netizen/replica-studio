import { createServerFn } from "@tanstack/react-start";
import { runAi } from "./ai.server";

export const generateAi = createServerFn({ method: "POST" })
  .inputValidator((input: { prompt: string; json?: boolean }) => {
    if (typeof input?.prompt !== "string" || !input.prompt.trim() || input.prompt.length > 20000) {
      throw new Error("Prompt inválido.");
    }
    return { prompt: input.prompt, json: !!input.json };
  })
  .handler(async ({ data }) => {
    let text = await runAi(data.prompt);
    if (data.json) {
      const m = text.match(/\{[\s\S]*\}/);
      text = m ? m[0] : text;
    }
    return { text };
  });
