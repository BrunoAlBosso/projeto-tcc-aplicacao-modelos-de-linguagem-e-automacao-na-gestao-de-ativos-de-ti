import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { supabase } from "@/lib/supabaseClient"
import { logActivity } from "@/lib/logger"

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
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
  Server, 
  Laptop, 
  Smartphone, 
  Globe,
  Database,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Component,
  Rocket,
  ServerCog
} from "lucide-react"

// Form Schema for validation
const itemSchema = z.object({
  name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
  item_type: z.string().min(1, { message: "O tipo é obrigatório." }),
  status: z.string().min(1, { message: "O status é obrigatório." }),
  environment: z.string().min(1, { message: "O ambiente é obrigatório." }),
  item_owner: z.string().min(1, { message: "O responsável é obrigatório." }),
  cpu_core: z.string().optional(),
  cpu_threads: z.string().optional(),
  ip_address: z.string().optional(),
  host_name: z.string().optional(),
  kernel_version: z.string().optional(),
  free_memory_gb: z.string().optional(),
  total_memory_gb: z.string().optional(),
  used_memory_percentage: z.string().optional(),
  os: z.string().optional(),
  storage_available: z.string().optional(),
  storage_total: z.string().optional(),
  current_cpu_usage: z.string().optional(),
  licenca_windows: z.string().optional(),
  status_licenca: z.string().optional(),
  data_expiracao: z.string().optional(),
});

// Type Definitions
type ConfigurationItem = {
  id: string;
  name: string;
  item_type: string;
  status: string;
  environment: string;
  item_owner: string;
  created_at: string;
  cpu_core?: string;
  cpu_threads?: string;
  ip_address?: string;
  host_name?: string;
  kernel_version?: string;
  free_memory_gb?: string;
  total_memory_gb?: string;
  used_memory_percentage?: string;
  os?: string;
  storage_available?: string;
  storage_total?: string;
  current_cpu_usage?: string;
  licenca_windows?: string;
  status_licenca?: string;
  data_expiracao?: string;
};

type User = {
  id: string;
  name: string;
};

// Helper to get icon based on type
const getIconForType = (type: string): React.ElementType => {
  switch (type?.toLowerCase()) {
    case "servidor": return Server
    case "workstation": return Laptop
    case "aplicação": return Smartphone
    case "website": return Globe
    case "database": return Database
    default: return Component
  }
}

export default function ConfigurationItems() {
  // State
  const [items, setItems] = useState<ConfigurationItem[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [filteredItems, setFilteredItems] = useState<ConfigurationItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedItem, setSelectedItem] = useState<ConfigurationItem | null>(null)
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const { toast } = useToast()
  const { addNotification } = useNotifications()

  // Form setup
  const form = useForm<z.infer<typeof itemSchema>>({
    resolver: zodResolver(itemSchema),
    defaultValues: { name: "", item_type: "", status: "", environment: "", item_owner: "" },
  })

  // Data Fetching
  const fetchData = useCallback(async () => {
    const { data: itemsData, error: itemsError } = await supabase.from("configuration_items").select("*").order("created_at", { ascending: false })
    if (itemsError) {
      toast({ title: "Erro ao buscar itens", description: "Houve um problema ao carregar os dados.", variant: "destructive" })
    } else {
      setItems(itemsData)
      setFilteredItems(itemsData)
    }

    const { data: usersData, error: usersError } = await supabase.from("users").select("id, name").order("name", { ascending: true })
    if(usersError) {
      toast({ title: "Erro ao buscar usuários", description: "Não foi possível carregar a lista de responsáveis.", variant: "destructive" })
    } else {
      setUsers(usersData)
    }
  }, [toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Search Logic
  useEffect(() => {
    const filtered = items.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.item_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredItems(filtered)
  }, [searchTerm, items])

  // CRUD Handlers
  const handleCreate = () => {
    form.reset({ name: "", item_type: "", status: "Ativo", environment: "Produção", item_owner: "" })
    setDialogMode("create")
    setIsFormOpen(true)
  }

  const handleEdit = (item: ConfigurationItem) => {
    setSelectedItem(item)
    form.reset(item)
    setDialogMode("edit")
    setIsFormOpen(true)
  }

  const handleView = (item: ConfigurationItem) => {
    setSelectedItem(item)
    setIsViewOpen(true)
  }

  const handleDelete = (item: ConfigurationItem) => {
    setSelectedItem(item)
    setIsDeleteOpen(true)
  }

  const onFormSubmit = async (values: z.infer<typeof itemSchema>) => {
    if (dialogMode === "create") {
      const { data, error } = await supabase.from("configuration_items").insert([values]).select().single();
      if (error) {
        toast({ title: `Erro ao criar item`, description: error.message, variant: "destructive" })
        await logActivity({
          action: 'INSERT',
          tableName: 'configuration_items',
          newData: values,
          isError: true,
          errorDetails: error,
          description: `Falha ao criar item de configuração: ${error.message}`
        });
      } else {
        toast({ title: `Item criado com sucesso!` })
        addNotification(`Novo item de configuração criado: ${data.name}`)
        await logActivity({
          action: 'INSERT',
          tableName: 'configuration_items',
          recordId: data.id,
          newData: data,
          description: `Item de configuração '${data.name}' foi criado.`
        });
        await fetchData()
        setIsFormOpen(false)
      }
    } else {
      const { data, error } = await supabase.from("configuration_items").update(values).match({ id: selectedItem?.id }).select().single()
      if (error) {
        toast({ title: `Erro ao editar item`, description: error.message, variant: "destructive" })
        await logActivity({
          action: 'UPDATE',
          tableName: 'configuration_items',
          recordId: selectedItem?.id,
          oldData: selectedItem,
          newData: values,
          isError: true,
          errorDetails: error,
          description: `Falha ao editar item de configuração: ${error.message}`
        });
      } else {
        toast({ title: `Item editado com sucesso!` })
        addNotification(`Item de configuração atualizado: ${data.name}`)
        await logActivity({
          action: 'UPDATE',
          tableName: 'configuration_items',
          recordId: selectedItem?.id,
          oldData: selectedItem,
          newData: data,
          description: `Item de configuração '${data.name}' foi atualizado.`
        });
        await fetchData()
        setIsFormOpen(false)
      }
    }
  }

  const onConfirmDelete = async () => {
    if (!selectedItem) return
    const oldItemData = { ...selectedItem };
    const { error } = await supabase.from("configuration_items").delete().match({ id: selectedItem.id })
    if (error) {
      toast({ title: "Erro ao excluir item", description: error.message, variant: "destructive" })
      await logActivity({
        action: 'DELETE',
        tableName: 'configuration_items',
        recordId: oldItemData.id,
        oldData: oldItemData,
        isError: true,
        errorDetails: error,
        description: `Falha ao excluir item de configuração: ${error.message}`
      });
    } else {
      toast({ title: "Item excluído com sucesso!" })
      addNotification(`Item de configuração excluído: ${oldItemData.name}`)
      await logActivity({
        action: 'DELETE',
        tableName: 'configuration_items',
        recordId: oldItemData.id,
        oldData: oldItemData,
        description: `Item de configuração '${oldItemData.name}' foi excluído.`
      });
      await fetchData()
    }
    setIsDeleteOpen(false)
  }

  const handleRegisterMachine = async () => {
    toast({ title: "Registrando máquina...", description: "Enviando requisição para o servidor." });

    try {
      const response = await fetch("http://localhost:3001/registrar-maquina", {
        method: "POST",
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Máquina Registrada!",
          description: result.message || "A máquina foi registrada com sucesso.",
        });
      } else {
        toast({
          title: "Erro ao registrar máquina",
          description: result.message || "Ocorreu um erro no servidor.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro de Conexão",
        description: `Não foi possível conectar ao servidor: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleRegisterServer = async () => {
    try {
      const response = await fetch("http://host.docker.internal:5678/webhook/8118d081-38c7-464f-b2f2-c7dbab44d385", {
        method: "POST",
      });
      if (response.ok) {
        toast({ title: "Servidor registrado", description: "O servidor foi registrado com sucesso." });
      } else {
        toast({ title: "Erro", description: "Não foi possível registrar o servidor.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erro de rede", description: "Não foi possível conectar ao webhook.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Itens de Configuração</h1>
          <p className="text-muted-foreground">Gerencie todos os componentes da sua infraestrutura de TI</p>
        </div>
        <div className="flex items-center space-x-2">
<button onClick={handleRegisterMachine} data-lov-id="src\pages\ConfigurationItems.tsx:352:10" data-lov-name="Button" data-component-path="src\pages\ConfigurationItems.tsx" data-component-line="352" data-component-file="ConfigurationItems.tsx" data-component-name="Button" data-component-content="%7B%22text%22%3A%22Executar%20Script%22%7D" class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-rocket h-4 w-4 mr-2" data-lov-id="src\pages\ConfigurationItems.tsx:353:12" data-lov-name="Rocket" data-component-path="src\pages\ConfigurationItems.tsx" data-component-line="353" data-component-file="ConfigurationItems.tsx" data-component-name="Rocket" data-component-content="%7B%22className%22%3A%22h-4%20w-4%20mr-2%22%7D"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path></svg>Registrar Máquina</button>
          <Button onClick={handleRegisterServer} variant="outline">
            <ServerCog className="h-4 w-4 mr-2" />
            Registrar Servidor
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Novo IC
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="bg-gradient-card shadow-card border-border/50">
        <CardContent className="p-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por nome, tipo ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card className="bg-gradient-card shadow-card border-border/50">
        <CardHeader><CardTitle>Lista de Itens</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead>Item</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ambiente</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>SO</TableHead>
                  <TableHead>Endereço IP</TableHead>
                  <TableHead>Status Licença</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead className="w-[50px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => {
                  const IconComponent = getIconForType(item.item_type)
                  return (
                    <TableRow key={item.id} className="border-border/50 hover:bg-nexus-surface/50">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-nexus-surface"><IconComponent className="h-4 w-4 text-nexus-secondary" /></div>
                          <div>
                            <div className="font-medium text-foreground">{item.name}</div>
                            <div className="text-sm text-muted-foreground">{item.id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{item.item_type}</TableCell>
                      <TableCell><Badge>{item.status}</Badge></TableCell>
                      <TableCell>{item.environment}</TableCell>
                      <TableCell>{item.item_owner}</TableCell>
                      <TableCell>{item.os}</TableCell>
                      <TableCell>{item.ip_address}</TableCell>
                      <TableCell>{item.status_licenca}</TableCell>
                      <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover border-border">
                            <DropdownMenuItem onClick={() => handleView(item)}><Eye className="h-4 w-4 mr-2" />Visualizar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(item)}><Edit className="h-4 w-4 mr-2" />Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(item)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Excluir</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-2xl bg-card">
          <DialogHeader><DialogTitle>{dialogMode === 'create' ? 'Criar Novo Item' : 'Editar Item'}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-4">
              <div className="max-h-[60vh] overflow-y-auto pr-4 space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField
                  control={form.control}
                  name="item_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Servidor">Servidor</SelectItem>
                          <SelectItem value="Workstation">Workstation</SelectItem>
                          <SelectItem value="Aplicação">Aplicação</SelectItem>
                          <SelectItem value="Website">Website</SelectItem>
                          <SelectItem value="Database">Database</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {form.watch("item_type") === "Servidor" && (
                  <>
                    <FormField control={form.control} name="cpu_core" render={({ field }) => (<FormItem><FormLabel>CPU Core</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="cpu_threads" render={({ field }) => (<FormItem><FormLabel>CPU Threads</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="ip_address" render={({ field }) => (<FormItem><FormLabel>Endereço de IP</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="host_name" render={({ field }) => (<FormItem><FormLabel>Host Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="kernel_version" render={({ field }) => (<FormItem><FormLabel>Kernel Version</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="free_memory_gb" render={({ field }) => (<FormItem><FormLabel>Memória Livre (GB)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="total_memory_gb" render={({ field }) => (<FormItem><FormLabel>Memória Total (GB)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="used_memory_percentage" render={({ field }) => (<FormItem><FormLabel>Memória Usada (%)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="os" render={({ field }) => (<FormItem><FormLabel>Sistema Operacional</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="storage_available" render={({ field }) => (<FormItem><FormLabel>Armazenamento Disponível</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="storage_total" render={({ field }) => (<FormItem><FormLabel>Armazenamento Total</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="current_cpu_usage" render={({ field }) => (<FormItem><FormLabel>Uso de CPU Atual</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </>
                )}
                {form.watch("item_type") === "Workstation" && (
                  <>
                    <FormField control={form.control} name="os" render={({ field }) => (<FormItem><FormLabel>Sistema Operacional</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="total_memory_gb" render={({ field }) => (<FormItem><FormLabel>Memória Total (GB)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="ip_address" render={({ field }) => (<FormItem><FormLabel>Endereço de IP</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="licenca_windows" render={({ field }) => (<FormItem><FormLabel>Licença Windows</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="status_licenca" render={({ field }) => (<FormItem><FormLabel>Status da Licença</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="data_expiracao" render={({ field }) => (<FormItem><FormLabel>Data de Expiração</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </>
                )}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Ativo">Ativo</SelectItem>
                          <SelectItem value="Inativo">Inativo</SelectItem>
                          <SelectItem value="Em Manutenção">Em Manutenção</SelectItem>
                          <SelectItem value="Desativado">Desativado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="environment" render={({ field }) => (<FormItem><FormLabel>Ambiente</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField
                  control={form.control}
                  name="item_owner"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Responsável</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um responsável" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {users.map(user => (
                            <SelectItem key={user.id} value={user.name}>{user.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-2xl bg-card">
          <DialogHeader><DialogTitle>Detalhes do Item</DialogTitle></DialogHeader>
          {selectedItem && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
              {Object.entries(selectedItem).map(([key, value]) => {
                // Mapeia chaves para labels mais amigáveis
                const labels: { [key: string]: string } = {
                  id: "ID",
                  name: "Nome",
                  item_type: "Tipo",
                  status: "Status",
                  environment: "Ambiente",
                  item_owner: "Responsável",
                  created_at: "Data de Criação",
                  cpu_core: "CPU Core",
                  cpu_threads: "CPU Threads",
                  ip_address: "Endereço de IP",
                  host_name: "Host Name",
                  kernel_version: "Kernel Version",
                  free_memory_gb: "Memória Livre (GB)",
                  total_memory_gb: "Memória Total (GB)",
                  used_memory_percentage: "Memória Usada (%)",
                  os: "Sistema Operacional",
                  storage_available: "Armazenamento Disponível",
                  storage_total: "Armazenamento Total",
                  current_cpu_usage: "Uso de CPU Atual",
                  licenca_windows: "Licença Windows",
                  status_licenca: "Status da Licença",
                  data_expiracao: "Data de Expiração",
                };

                // Ignora campos que não queremos mostrar ou que estão vazios
                if (!labels[key] || value === null || value === "" || value === undefined) {
                  return null;
                }

                // Formata a data
                const displayValue = key === 'created_at' ? new Date(value).toLocaleString() : value;

                return (
                  <div key={key} className="flex justify-between border-b border-border/50 pb-2">
                    <span className="font-semibold text-muted-foreground">{labels[key]}:</span>
                    <span className="text-foreground text-right">{displayValue}</span>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogDescription>Essa ação não pode ser desfeita. Isso excluirá permanentemente o item "{selectedItem?.name}".</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmDelete}>Continuar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

