import { createFileRoute } from "@tanstack/react-router";
import { DeluxRoot } from "@/delux/DeluxRoot";

const title = "Delux — Desenvolvimento Pessoal & Execução de Metas";
const description =
  "Transforme qualquer objetivo ou sonho em um sistema de caminhos práticos passo a passo com planejamento inteligente e assistente de IA.";

export const Route = createFileRoute("/")({
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
