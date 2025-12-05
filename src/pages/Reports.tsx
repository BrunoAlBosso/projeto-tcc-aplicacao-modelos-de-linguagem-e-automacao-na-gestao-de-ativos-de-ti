import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export function Reports() {
  const [reportContent, setReportContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoadReport = async () => {
    setIsLoading(true);
    setError(null);
    setReportContent("");

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOfToday = today.toISOString();

      // Fetch the 3 most recent report parts from today
      const { data, error: dbError } = await supabase
        .from("texto_relatorio")
        .select("relatorio")
        .gte("created_at", startOfToday)
        .order("created_at", { ascending: false }) // Get the latest first
        .limit(3); // We want the 3 parts of the report

      if (dbError) {
        throw dbError;
      }

      if (data && data.length > 0) {
        // The parts are fetched latest-first, so we reverse them to assemble in the correct order.
        const reportParts = data.map(item => item.relatorio).reverse();
        const fullReport = reportParts.join("\n\n"); // Join parts with a double newline for separation
        setReportContent(fullReport);
      } else {
        setError("Nenhum relatório encontrado para a data de hoje.");
      }

    } catch (e: any) {
      setError("Falha ao carregar o relatório do Supabase. Verifique o console para mais detalhes.");
      console.error("Erro ao buscar relatório do Supabase:", e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Relatórios</h1>
      <p>Clique no botão abaixo para carregar o último relatório gerado hoje.</p>
      
      <Button onClick={handleLoadReport} disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Carregando...
          </>
        ) : (
          "Carregar Último Relatório"
        )}
      </Button>

      {error && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Aviso</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {reportContent && (
        <Card>
          <CardHeader>
            <CardTitle>Conteúdo do Relatório</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap font-sans">{reportContent}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
