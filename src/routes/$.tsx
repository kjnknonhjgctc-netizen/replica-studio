import { createFileRoute } from "@tanstack/react-router";
import { DeluxRoot } from "@/delux/DeluxRoot";

const title = "Delux — Seu sistema de metas";
const description =
  "Objetivos, missões diárias, planejamento semanal e assistente de IA para executar suas metas com consistência.";

export const Route = createFileRoute("/$")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DeluxRoot,
});
