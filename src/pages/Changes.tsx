import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

// Tipo atualizado para o registro de log
type LogEntry = {
  id: number;
  created_at: string;
  action: string; // ex: 'INSERT', 'UPDATE', 'DELETE'
  table_name: string; // ex: 'configuration_items', 'users'
};

// Função para buscar os logs no Supabase
const fetchSystemLogs = async () => {
  const { data, error } = await supabase
    .from("logs")
    .select("id, created_at, action, table_name")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(error.message);
  }
  return data as LogEntry[];
};

export function ChangesPage() {
  const { data: logs, isLoading, isError, error } = useQuery<LogEntry[]>({
    queryKey: ["systemLogs"],
    queryFn: fetchSystemLogs,
  });

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      );
    }

    if (isError) {
      return (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Erro ao Carregar Logs</AlertTitle>
          <AlertDescription>{error?.message}</AlertDescription>
        </Alert>
      );
    }

    if (!logs || logs.length === 0) {
        return (
            <Alert>
                <Terminal className="h-4 w-4" />
                <AlertTitle>Nenhum Log Encontrado</AlertTitle>
                <AlertDescription>A tabela de logs está vazia ou não foi encontrada.</AlertDescription>
            </Alert>
        )
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Timestamp</TableHead>
            <TableHead>Ação</TableHead>
            <TableHead>Tabela Afetada</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
              <TableCell>{log.action}</TableCell>
              <TableCell>{log.table_name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <h1 className="text-2xl font-bold mb-4">Log de Mudanças do Sistema</h1>
      <Card className="flex-grow">
        <CardContent className="p-4">
            {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}