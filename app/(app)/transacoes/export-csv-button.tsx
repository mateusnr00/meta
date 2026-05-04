"use client";

import { useTransition } from "react";
import { Download } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ExportCsvButton() {
  const params = useSearchParams();
  const [pending, start] = useTransition();

  const handleExport = () => {
    start(async () => {
      try {
        const res = await fetch(`/transacoes/export?${params.toString()}`, {
          method: "GET",
        });
        if (!res.ok) {
          throw new Error("Falha ao exportar");
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const today = new Date().toISOString().slice(0, 10);
        a.href = url;
        a.download = `meta-transacoes-${today}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast.success("CSV baixado!");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro ao exportar");
      }
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={handleExport}
      disabled={pending}
    >
      <Download className="size-4" />
      <span className="hidden sm:inline">Exportar CSV</span>
      <span className="sm:hidden">CSV</span>
    </Button>
  );
}
