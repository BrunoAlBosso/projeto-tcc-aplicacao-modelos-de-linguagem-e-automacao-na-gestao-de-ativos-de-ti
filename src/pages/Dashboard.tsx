import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Server, 
  ShieldAlert, 
  GitCommit, 
  Users, 
  TrendingUp, 
  Loader2 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function Dashboard() {
  const { toast } = useToast();
  const [isSendingReport, setIsSendingReport] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      // Modificado para buscar os tipos de ICs para o gráfico
      const { data: config_items_data, error: ciError } = await supabase.from('configuration_items').select('item_type');
      if (ciError) throw new Error(`Erro ao buscar Itens de Configuração: ${ciError.message}`);

      const { count: incidents } = await supabase.from('incidents').select('*', { count: 'exact', head: true });
      const { count: changes } = await supabase.from('changes').select('*', { count: 'exact', head: true });
      const { count: users } = await supabase.from('users').select('*', { count: 'exact', head: true });

      return {
        config_items_count: config_items_data?.length ?? 0,
        config_items_types: config_items_data ?? [], // Dados para o gráfico
        incidents: incidents ?? 0,
        changes: changes ?? 0,
        users: users ?? 0,
      };
    },
  });

  // Processa os dados para o gráfico de pizza de ICs por tipo
  const ciTypeSummary = useMemo(() => {
    if (!data?.config_items_types) return [];
    const counts = data.config_items_types.reduce((acc: { [key: string]: number }, item: { item_type: string }) => {
      const type = item.item_type || 'Não Definido';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [data?.config_items_types]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

  const handleReportClick = async () => {
    setIsSendingReport(true);
    toast({ title: "Gerando relatório...", description: "Buscando URL do webhook." });

    try {
      const { data: settingsData, error: settingsError } = await supabase
        .from('settings')
        .select('value')
        .eq('id', 1)
        .single();

      if (settingsError || !settingsData || !settingsData.value) {
        throw new Error("URL não encontrada na tabela 'settings' com id=1.");
      }

      const webhookUrl = settingsData.value;
      toast({ title: "Enviando solicitação...", description: `Para: ${webhookUrl}` });

      const payload = {
        type: "report_request",
        requested_at: new Date().toISOString(),
        metrics: {
          config_items: data?.config_items_count ?? 0,
          incidents: data?.incidents ?? 0,
          changes: data?.changes ?? 0,
          users: data?.users ?? 0,
        },
        ci_type_summary: ciTypeSummary,
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Falha na chamada do webhook: ${response.statusText} (Status: ${response.status})`);
      }

      toast({ 
        title: "Relatório enviado!", 
        description: "A solicitação de relatório foi enviada com sucesso.",
        variant: "success"
      });

    } catch (error: any) {
      toast({
        title: "Erro ao gerar relatório",
        description: error.message || "Ocorreu um problema ao contatar o webhook.",
        variant: "destructive",
      });
    } finally {
      setIsSendingReport(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (isError) {
    return <div className="text-red-500">Erro ao carregar os dados do dashboard.</div>;
  }

  const StatCard = ({ title, value, icon: Icon, description }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button onClick={handleReportClick} disabled={isSendingReport}>
          {isSendingReport ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <TrendingUp className="h-4 w-4 mr-2" />
          )}
          {isSendingReport ? "Enviando..." : "Relatórios"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Itens de Configuração" value={data.config_items_count} icon={Server} description="Total de ICs gerenciados" />
        <StatCard title="Incidentes Abertos" value={data.incidents} icon={ShieldAlert} description="Incidentes atuais" />
        <StatCard title="Mudanças Registradas" value={data.changes} icon={GitCommit} description="Total de mudanças" />
        <StatCard title="Usuários" value={data.users} icon={Users} description="Usuários no sistema" />
      </div>

      {/* Gráfico de ICs por Tipo */}
      <Card>
        <CardHeader>
          <CardTitle>Itens de Configuração por Tipo</CardTitle>
        </CardHeader>
        <CardContent style={{ height: '300px' }}>
          {ciTypeSummary.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ciTypeSummary}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {ciTypeSummary.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Quantidade']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Nenhum item de configuração para exibir.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default Dashboard;