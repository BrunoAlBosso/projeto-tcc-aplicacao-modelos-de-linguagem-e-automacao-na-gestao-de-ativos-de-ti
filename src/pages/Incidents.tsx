import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { supabase } from "@/lib/supabaseClient"
import { logActivity } from "@/lib/logger"

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { useNotifications } from "@/hooks/use-notifications"

// Icons
import { 
  Plus, 
  Search, 
  AlertTriangle,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Bot,
  Loader2
} from "lucide-react"

// Form Schema
const incidentSchema = z.object({
  title: z.string().min(3, { message: "O título deve ter pelo menos 3 caracteres." }),
  description: z.string().optional(),
  status: z.string({ required_error: "O status é obrigatório." }),
  priority: z.string({ required_error: "A prioridade é obrigatória." }),
  assigned_to_user_id: z.string().uuid().nullable().optional(),
  related_ci_id: z.string().uuid().nullable().optional(),
})

// Type Definitions
type User = { id: string; name: string; };
type ConfigurationItem = { id: string; name: string; };
type Incident = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  created_at: string;
  users: { name: string } | null;
  configuration_items: { name: string } | null;
  assigned_to_user_id: string | null;
  related_ci_id: string | null;
};

const priorityColors = {
  "Baixa": "bg-gray-500",
  "Média": "bg-yellow-500",
  "Alta": "bg-orange-500",
  "Crítica": "bg-red-500",
} as const;

export default function Incidents() {
  // State
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [configItems, setConfigItems] = useState<ConfigurationItem[]>([])
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const { toast } = useToast()
  const { addNotification } = useNotifications()

  // AI Solution State
  const [isSolutionDialogOpen, setIsSolutionDialogOpen] = useState(false);
  const [solutionText, setSolutionText] = useState("");
  const [isSolutionLoading, setIsSolutionLoading] = useState(false);
  const [solutionError, setSolutionError] = useState<string | null>(null);

  // Form
  const form = useForm<z.infer<typeof incidentSchema>>({
    resolver: zodResolver(incidentSchema),
  })

  // Data Fetching
  async function fetchData() {
    const { data, error } = await supabase
      .from("incidents")
      .select(`
        *,
        users ( name ),
        configuration_items ( name )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      toast({ title: "Erro ao buscar incidentes", description: error.message, variant: "destructive" })
    } else {
      setIncidents(data as Incident[])
      setFilteredIncidents(data as Incident[])
    }

    const { data: usersData, error: usersError } = await supabase.from("users").select("id, name");
    if (!usersError) setUsers(usersData);

    const { data: ciData, error: ciError } = await supabase.from("configuration_items").select("id, name");
    if (!ciError) setConfigItems(ciData);
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Search
  useEffect(() => {
    const filtered = incidents.filter(i => i.title.toLowerCase().includes(searchTerm.toLowerCase()))
    setFilteredIncidents(filtered)
  }, [searchTerm, incidents])

  // AI Solution Handler
  const handleShowSolution = async () => {
    setIsSolutionLoading(true);
    setSolutionError(null);
    setSolutionText("");
    setIsSolutionDialogOpen(true);

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOfToday = today.toISOString();

      const { data, error: dbError } = await supabase
        .from("texto_incidente")
        .select("solucao_incidente")
        .gte("created_at", startOfToday)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (dbError) {
        if (dbError.code === 'PGRST116') {
          setSolutionError("Nenhuma solução de IA encontrada para hoje.");
        } else {
          throw dbError;
        }
      }

      if (data) {
        setSolutionText(data.solucao_incidente);
      }
    } catch (e: any) {
      setSolutionError("Falha ao buscar a solução. Tente novamente.");
      console.error("Erro ao buscar solução do Supabase:", e);
    } finally {
      setIsSolutionLoading(false);
    }
  };

  // CRUD Handlers
  const handleCreate = () => {
    form.reset({ title: "", description: "", status: "Aberto", priority: "Baixa", assigned_to_user_id: null, related_ci_id: null })
    setDialogMode("create")
    setIsFormOpen(true)
  }

  const handleEdit = (incident: Incident) => {
    setSelectedIncident(incident)
    form.reset(incident)
    setDialogMode("edit")
    setIsFormOpen(true)
  }

  const handleView = (incident: Incident) => {
    setSelectedIncident(incident)
    setIsViewOpen(true)
  }

  const handleDelete = (incident: Incident) => {
    setSelectedIncident(incident)
    setIsDeleteOpen(true)
  }

  const onFormSubmit = async (values: z.infer<typeof incidentSchema>) => {
    const dataToSubmit = { ...values };
    if (dataToSubmit.assigned_to_user_id === '') dataToSubmit.assigned_to_user_id = null;
    if (dataToSubmit.related_ci_id === '') dataToSubmit.related_ci_id = null;

    if (dialogMode === "create") {
      const { data, error } = await supabase.from("incidents").insert([dataToSubmit]).select().single();
      if (error) {
        toast({ title: `Erro ao criar incidente`, description: error.message, variant: "destructive" })
        await logActivity({
          action: 'INSERT',
          tableName: 'incidents',
          newData: dataToSubmit,
          isError: true,
          errorDetails: error,
          description: `Falha ao criar incidente: ${error.message}`
        });
      } else {
        toast({ title: `Incidente criado com sucesso!` })
        addNotification(`Novo incidente criado: ${data.title}`)
        await logActivity({
          action: 'INSERT',
          tableName: 'incidents',
          recordId: data.id,
          newData: data,
          description: `Incidente '${data.title}' foi criado.`
        });
        await fetchData()
        setIsFormOpen(false)
      }
    } else {
      const { data, error } = await supabase.from("incidents").update(dataToSubmit).match({ id: selectedIncident?.id }).select().single();
      if (error) {
        toast({ title: `Erro ao editar incidente`, description: error.message, variant: "destructive" })
        await logActivity({
          action: 'UPDATE',
          tableName: 'incidents',
          recordId: selectedIncident?.id,
          oldData: selectedIncident,
          newData: dataToSubmit,
          isError: true,
          errorDetails: error,
          description: `Falha ao editar incidente: ${error.message}`
        });
      } else {
        toast({ title: `Incidente editado com sucesso!` })
        addNotification(`Incidente atualizado: ${data.title}`)
        await logActivity({
          action: 'UPDATE',
          tableName: 'incidents',
          recordId: selectedIncident?.id,
          oldData: selectedIncident,
          newData: data,
          description: `Incidente '${data.title}' foi atualizado.`
        });
        await fetchData()
        setIsFormOpen(false)
      }
    }
  }

  const onConfirmDelete = async () => {
    if (!selectedIncident) return
    const oldIncidentData = { ...selectedIncident };
    const { error } = await supabase.from("incidents").delete().match({ id: selectedIncident.id })
    if (error) {
      toast({ title: "Erro ao excluir incidente", description: error.message, variant: "destructive" })
      await logActivity({
        action: 'DELETE',
        tableName: 'incidents',
        recordId: oldIncidentData.id,
        oldData: oldIncidentData,
        isError: true,
        errorDetails: error,
        description: `Falha ao excluir incidente: ${error.message}`
      });
    } else {
      toast({ title: "Incidente excluído com sucesso!" })
      addNotification(`Incidente excluído: ${oldIncidentData.title}`)
      await logActivity({
        action: 'DELETE',
        tableName: 'incidents',
        recordId: oldIncidentData.id,
        oldData: oldIncidentData,
        description: `Incidente '${oldIncidentData.title}' foi excluído.`
      });
      await fetchData()
    }
    setIsDeleteOpen(false)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Incidentes</h1>
          <p className="text-muted-foreground">Gerencie os incidentes de TI</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleShowSolution} variant="outline"><Bot className="h-4 w-4 mr-2" /> Ver Solução da IA</Button>
          <Button onClick={handleCreate}><Plus className="h-4 w-4 mr-2" /> Novo Incidente</Button>
        </div>
      </div>

      {/* Search */}
      <Card className="bg-gradient-card shadow-card border-border/50">
        <CardContent className="p-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input placeholder="Buscar por título..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
        </CardContent>
      </Card>

      {/* Incidents Table */}
      <Card className="bg-gradient-card shadow-card border-border/50">
        <CardHeader><CardTitle>Lista de Incidentes</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50">
            <Table>
              <TableHeader><TableRow className="border-border/50">
                <TableHead>Título</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Item Afetado</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-[50px]">Ações</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filteredIncidents.map((incident) => (
                  <TableRow key={incident.id} className="border-border/50 hover:bg-nexus-surface/50">
                    <TableCell className="font-medium">{incident.title}</TableCell>
                    <TableCell><Badge>{incident.status}</Badge></TableCell>
                    <TableCell><Badge className={priorityColors[incident.priority as keyof typeof priorityColors] || "bg-gray-400"}>{incident.priority}</Badge></TableCell>
                    <TableCell>{incident.users?.name || "N/A"}</TableCell>
                    <TableCell>{incident.configuration_items?.name || "N/A"}</TableCell>
                    <TableCell>{new Date(incident.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreHorizontal /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(incident)}><Eye className="h-4 w-4 mr-2" />Visualizar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(incident)}><Edit className="h-4 w-4 mr-2" />Editar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(incident)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Excluir</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card">
          <DialogHeader><DialogTitle>{dialogMode === 'create' ? 'Novo Incidente' : 'Editar Incidente'}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-4">
              <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Título</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Aberto">Aberto</SelectItem><SelectItem value="Em Andamento">Em Andamento</SelectItem><SelectItem value="Resolvido">Resolvido</SelectItem><SelectItem value="Fechado">Fechado</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="priority" render={({ field }) => (<FormItem><FormLabel>Prioridade</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Baixa">Baixa</SelectItem><SelectItem value="Média">Média</SelectItem><SelectItem value="Alta">Alta</SelectItem><SelectItem value="Crítica">Crítica</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="assigned_to_user_id" render={({ field }) => (<FormItem><FormLabel>Atribuído Para</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value || ""}><FormControl><SelectTrigger><SelectValue placeholder="Selecione um usuário" /></SelectTrigger></FormControl><SelectContent>{users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="related_ci_id" render={({ field }) => (<FormItem><FormLabel>Item de Configuração Afetado</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value || ""}><FormControl><SelectTrigger><SelectValue placeholder="Selecione um item" /></SelectTrigger></FormControl><SelectContent>{configItems.map(ci => <SelectItem key={ci.id} value={ci.id}>{ci.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
              <DialogFooter><DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose><Button type="submit">Salvar</Button></DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Detalhes do Incidente</DialogTitle></DialogHeader>
          {selectedIncident && <div className="space-y-2">
            <p><strong>Título:</strong> {selectedIncident.title}</p>
            <p><strong>Descrição:</strong> {selectedIncident.description || "N/A"}</p>
            <p><strong>Status:</strong> {selectedIncident.status}</p>
            <p><strong>Prioridade:</strong> {selectedIncident.priority}</p>
            <p><strong>Responsável:</strong> {selectedIncident.users?.name || "N/A"}</p>
            <p><strong>Item Afetado:</strong> {selectedIncident.configuration_items?.name || "N/A"}</p>
            <p><strong>Criado em:</strong> {new Date(selectedIncident.created_at).toLocaleString()}</p>
          </div>}
        </DialogContent>
      </Dialog>

      {/* AI Solution Dialog */}
      <Dialog open={isSolutionDialogOpen} onOpenChange={setIsSolutionDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Possível Solução Gerada por IA</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] w-full rounded-md border p-4">
            {isSolutionLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : solutionError ? (
              <p className="text-destructive">{solutionError}</p>
            ) : (
              <pre className="text-sm whitespace-pre-wrap font-sans">
                {solutionText || "Nenhuma solução disponível."}
              </pre>
            )}
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSolutionDialogOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogDescription>Essa ação não pode ser desfeita. Isso excluirá permanentemente o incidente.</AlertDialogDescription>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={onConfirmDelete}>Continuar</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
