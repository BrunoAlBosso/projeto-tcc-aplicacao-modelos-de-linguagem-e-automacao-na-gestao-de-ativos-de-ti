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
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

// Icons
import { 
  Plus, 
  Search, 
  Users as UsersIcon,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye
} from "lucide-react"

// Form Schema for validation
const userSchema = z.object({
  name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
  email: z.string().email({ message: "Por favor, insira um email válido." }),
  role: z.string().min(1, { message: "A função é obrigatória." }),
})

// Type for a user from Supabase
type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
};

export default function Users() {
  // State
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const { toast } = useToast()

  // Form setup
  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: { name: "", email: "", role: "" },
  })

  // Data Fetching
  async function fetchUsers() {
    const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })
    if (error) {
      toast({ title: "Erro ao buscar usuários", description: "Houve um problema ao carregar os dados.", variant: "destructive" })
    } else {
      setUsers(data)
      setFilteredUsers(data)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Search Logic
  useEffect(() => {
    const filtered = users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredUsers(filtered)
  }, [searchTerm, users])

  // CRUD Handlers
  const handleCreate = () => {
    form.reset({ name: "", email: "", role: "" })
    setDialogMode("create")
    setIsFormOpen(true)
  }

  const handleEdit = (user: User) => {
    setSelectedUser(user)
    form.reset(user)
    setDialogMode("edit")
    setIsFormOpen(true)
  }

  const handleView = (user: User) => {
    setSelectedUser(user)
    setIsViewOpen(true)
  }

  const handleDelete = (user: User) => {
    setSelectedUser(user)
    setIsDeleteOpen(true)
  }

  const onFormSubmit = async (values: z.infer<typeof userSchema>) => {
    if (dialogMode === "create") {
      const { data, error } = await supabase.from("users").insert([values]).select().single();
      if (error) {
        toast({ title: `Erro ao criar usuário`, description: error.message, variant: "destructive" })
        await logActivity({
          action: 'INSERT',
          tableName: 'users',
          newData: values,
          isError: true,
          errorDetails: error,
          description: `Falha ao criar usuário: ${error.message}`
        });
      } else {
        toast({ title: `Usuário criado com sucesso!` })
        await logActivity({
          action: 'INSERT',
          tableName: 'users',
          recordId: data.id,
          newData: data,
          description: `Usuário '${data.name}' foi criado.`
        });
        await fetchUsers()
        setIsFormOpen(false)
      }
    } else {
      const { data, error } = await supabase.from("users").update(values).match({ id: selectedUser?.id }).select().single()
      if (error) {
        toast({ title: `Erro ao editar usuário`, description: error.message, variant: "destructive" })
        await logActivity({
          action: 'UPDATE',
          tableName: 'users',
          recordId: selectedUser?.id,
          oldData: selectedUser,
          newData: values,
          isError: true,
          errorDetails: error,
          description: `Falha ao editar usuário: ${error.message}`
        });
      } else {
        toast({ title: `Usuário editado com sucesso!` })
        await logActivity({
          action: 'UPDATE',
          tableName: 'users',
          recordId: selectedUser?.id,
          oldData: selectedUser,
          newData: data,
          description: `Usuário '${data.name}' foi atualizado.`
        });
        await fetchUsers()
        setIsFormOpen(false)
      }
    }
  }

  const onConfirmDelete = async () => {
    if (!selectedUser) return
    const oldUserData = { ...selectedUser }; // Clone the user data before deleting
    const { error } = await supabase.from("users").delete().match({ id: selectedUser.id })
    if (error) {
      toast({ title: "Erro ao excluir usuário", description: error.message, variant: "destructive" })
      await logActivity({
        action: 'DELETE',
        tableName: 'users',
        recordId: oldUserData.id,
        oldData: oldUserData,
        isError: true,
        errorDetails: error,
        description: `Falha ao excluir usuário: ${error.message}`
      });
    } else {
      toast({ title: "Usuário excluído com sucesso!" })
      await logActivity({
        action: 'DELETE',
        tableName: 'users',
        recordId: oldUserData.id,
        oldData: oldUserData,
        description: `Usuário '${oldUserData.name}' foi excluído.`
      });
      await fetchUsers()
    }
    setIsDeleteOpen(false)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Usuários</h1>
          <p className="text-muted-foreground">Gerencie os usuários do sistema</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {/* Filters and Search */}
      <Card className="bg-gradient-card shadow-card border-border/50">
        <CardContent className="p-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por nome, email ou função..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-gradient-card shadow-card border-border/50">
        <CardHeader><CardTitle>Lista de Usuários</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead className="w-[50px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="border-border/50 hover:bg-nexus-surface/50">
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell><Badge>{user.role}</Badge></TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border-border">
                          <DropdownMenuItem onClick={() => handleView(user)}><Eye className="h-4 w-4 mr-2" />Visualizar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(user)}><Edit className="h-4 w-4 mr-2" />Editar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(user)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Excluir</DropdownMenuItem>
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
          <DialogHeader><DialogTitle>{dialogMode === 'create' ? 'Criar Novo Usuário' : 'Editar Usuário'}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="role" render={({ field }) => (<FormItem><FormLabel>Função</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
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
        <DialogContent className="sm:max-w-[425px] bg-card">
          <DialogHeader><DialogTitle>Detalhes do Usuário</DialogTitle></DialogHeader>
          {selectedUser && (
            <div className="space-y-2">
              <p><strong>ID:</strong> {selectedUser.id}</p>
              <p><strong>Nome:</strong> {selectedUser.name}</p>
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>Função:</strong> {selectedUser.role}</p>
              <p><strong>Criado em:</strong> {new Date(selectedUser.created_at).toLocaleString()}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogDescription>Essa ação não pode ser desfeita. Isso excluirá permanentemente o usuário "{selectedUser?.name}".</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmDelete}>Continuar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
