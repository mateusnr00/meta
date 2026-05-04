import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Meta — Finanças Pessoais",
    short_name: "Meta",
    description: "Controle completo da sua vida financeira",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b1018",
    theme_color: "#0b1018",
    categories: ["finance", "productivity"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/apple-icon.svg",
        sizes: "180x180",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Nova transação",
        short_name: "Nova",
        url: "/transacoes/nova",
        description: "Registrar uma receita ou despesa",
      },
      {
        name: "Cartões",
        url: "/cartoes",
      },
      {
        name: "Relatórios",
        url: "/relatorios",
      },
    ],
  };
}
