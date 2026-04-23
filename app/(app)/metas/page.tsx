import { Target } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export default function MetasPage() {
  return (
    <ComingSoon
      icon={Target}
      title="Metas & Orçamentos"
      description="Defina orçamentos por categoria e metas de economia. Esta área faz parte da Fase 2 do projeto."
      features={[
        "Orçamento mensal por categoria",
        "Alertas ao se aproximar do limite",
        "Metas de economia com prazo",
        "Projeção de fechamento do mês",
        "Meta de saldo mínimo",
        "Indicadores de progresso",
      ]}
    />
  );
}
