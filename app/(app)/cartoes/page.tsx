import { CreditCard } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export default function CartoesPage() {
  return (
    <ComingSoon
      icon={CreditCard}
      title="Cartões de crédito"
      description="Gerencie faturas, parcelamentos e limites em um só lugar. Esta área faz parte da Fase 2 do projeto."
      features={[
        "Lançamentos separados por fatura",
        "Data de fechamento e vencimento",
        "Previsão da próxima fatura",
        "Histórico de faturas passadas",
        "Controle de limite e utilização",
        "Parcelamentos com visão consolidada",
      ]}
    />
  );
}
