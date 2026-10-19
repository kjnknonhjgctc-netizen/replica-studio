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

export const synthesizeSpeech = createServerFn({ method: "POST" })
  .inputValidator((input: { text: string }) => {
    if (typeof input?.text !== "string" || !input.text.trim() || input.text.length > 4096) {
      throw new Error("Texto inválido para síntese de voz.");
    }
    return { text: input.text.trim() };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env["OPENAI_API_KEY"];
    if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice: "onyx",
        input: data.text,
        instructions: "Fale em português brasileiro. Use uma voz masculina, elegante, acolhedora e intelectual, com ritmo calmo e natural, articulação clara e entonação serena. Soe confiante e humano, sem exagero teatral. Preserve pausas naturais entre ideias.",
        response_format: "mp3",
        speed: 0.92,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("OpenAI speech API failed:", response.status, detail.slice(0, 500));
      throw new Error(`Falha na API de voz OpenAI (${response.status}).`);
    }

    const audio = Buffer.from(await response.arrayBuffer()).toString("base64");
    return { audioBase64: audio };
  });
