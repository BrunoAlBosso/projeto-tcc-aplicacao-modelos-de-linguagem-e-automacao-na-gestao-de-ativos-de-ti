import { useMemo } from 'react';
import ReactFlow, {
  Controls,
  Background,
  Node,
  Edge,
  MarkerType,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

// Função para buscar os dados
const fetchRelationshipData = async () => {
  const { data: items, error: itemsError } = await supabase
    .from('configuration_items')
    .select('id, name, status, created_at, item_owner')
    .not('item_owner', 'is', null);

  if (itemsError) {
    throw new Error(`Erro ao buscar itens de configuração: ${itemsError.message}`);
  }

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, name, role, created_at');

  if (usersError) {
    throw new Error(`Erro ao buscar usuários: ${usersError.message}`);
  }

  const usersByName = new Map(users.map(user => [user.name, user]));

  const itemsWithResponsibles = items
    .map(item => ({
      ...item,
      responsible: usersByName.get(item.item_owner)
    }))
    .filter(item => item.responsible);

  return itemsWithResponsibles;
};

// --- Componentes de Nó Customizados com Pontos de Conexão (Handles) ---

function UserNode({ data }: { data: any }) {
  return (
    <Card className="shadow-lg border-2 border-blue-500 w-48">
      <CardContent className="p-4">
        <div className="font-bold text-blue-800">{data.name}</div>
        <div className="text-sm text-gray-600">Função: {data.role}</div>
        <div className="text-xs text-gray-400 mt-2">
          Criado em: {format(new Date(data.created_at), 'dd/MM/yyyy')}
        </div>
      </CardContent>
      {/* Ponto de conexão de SAÍDA (source) na direita */}
      <Handle type="source" position={Position.Right} style={{ background: '#3b82f6' }} />
    </Card>
  );
}

function CiNode({ data }: { data: any }) {
    const statusColors: { [key: string]: string } = {
        Ativo: 'border-green-500',
        Inativo: 'border-red-500',
        Manutenção: 'border-yellow-500',
      };

  return (
    <Card className={`shadow-md ${statusColors[data.status] || 'border-gray-400'} border-2 w-56`}>
      <CardContent className="p-4">
        <div className="font-bold">{data.name}</div>
        <div className="text-sm">
            Status: <span className="font-semibold">{data.status}</span>
        </div>
        <div className="text-xs text-gray-400 mt-2">
          Criado em: {format(new Date(data.created_at), 'dd/MM/yyyy')}
        </div>
      </CardContent>
      {/* Ponto de conexão de ENTRADA (target) na esquerda */}
      <Handle type="target" position={Position.Left} style={{ background: '#3b82f6' }} />
    </Card>
  );
}

const nodeTypes = {
  userNode: UserNode,
  ciNode: CiNode,
};

// --- Componente Principal da Página ---

export function RelationshipsPage() {
  const { data: items, isLoading, isError, error } = useQuery({
    queryKey: ['relationship_data_v5'], // Nova chave para garantir atualização
    queryFn: fetchRelationshipData,
  });

  const { nodes, edges } = useMemo(() => {
    if (!items || items.length === 0) return { nodes: [], edges: [] };

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    const userMap = new Map();

    let userY = 0;

    items.forEach((item) => {
      const responsible = item.responsible;
      if (!responsible) return;

      if (!userMap.has(responsible.id)) {
        userMap.set(responsible.id, { ...responsible, yPos: userY });
        newNodes.push({
          id: `user-${responsible.id}`,
          type: 'userNode',
          position: { x: 50, y: userY },
          data: {
            name: responsible.name,
            role: responsible.role,
            created_at: responsible.created_at,
          },
        });
        userY += 250;
      }

      const userNodeInfo = userMap.get(responsible.id);
      const ciCountForUser = newNodes.filter(
        (n) => n.id.startsWith('ci-') && n.data.responsibleId === responsible.id
      ).length;

      newNodes.push({
        id: `ci-${item.id}`,
        type: 'ciNode',
        position: { x: 450 + (ciCountForUser * 280), y: userNodeInfo.yPos },
        data: {
          name: item.name,
          status: item.status,
          created_at: item.created_at,
          responsibleId: responsible.id,
        },
      });

      newEdges.push({
        id: `edge-${responsible.id}-${item.id}`,
        source: `user-${responsible.id}`,
        target: `ci-${item.id}`,
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#3b82f6',
        },
        style: {
            strokeWidth: 2,
            stroke: '#3b82f6',
        }
      });
    });

    return { nodes: newNodes, edges: newEdges };
  }, [items]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-4 text-lg">Carregando relacionamentos...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Erro ao Carregar Dados</AlertTitle>
        <AlertDescription>
          Não foi possível buscar os dados de relacionamentos.
          <p className="mt-2 font-mono text-xs">{error?.message}</p>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Visualizador de Relacionamentos</h1>
      </div>
      <Card className="flex-grow">
        <CardContent className="p-0 h-full">
          {nodes.length === 0 && !isLoading ? (
             <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Nenhum relacionamento para exibir.</p>
             </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.2 }}
            >
              <Controls />
              <Background />
            </ReactFlow>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default RelationshipsPage;