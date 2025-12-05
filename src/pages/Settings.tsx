import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { supabase } from "@/lib/supabaseClient"
import { logActivity } from "@/lib/logger"

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"

// Icons
import { Link } from "lucide-react"

// Form Schema
const settingsSchema = z.object({
  n8n_webhook_url: z.string().url({ message: "Por favor, insira uma URL válida." }).or(z.literal('')),
})

const SETTING_KEY = 'n8n_webhook_url';

export default function Settings() {
  // State & Hooks
  const { toast } = useToast()
  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { n8n_webhook_url: "" },
  })

  // Data Fetching
  useEffect(() => {
    async function fetchSettings() {
      const { data, error } = await supabase
        .from("settings")
        .select("value")
        .eq("key", SETTING_KEY)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        toast({ title: "Erro ao buscar configurações", description: error.message, variant: "destructive" })
      } else if (data) {
        form.setValue("n8n_webhook_url", data.value || "");
      }
    }

    fetchSettings()
  }, [form, toast])

  // Form Submission
  const onSubmit = async (values: z.infer<typeof settingsSchema>) => {
    // Fetch old value before update
    const { data: oldData, error: fetchError } = await supabase
      .from("settings")
      .select("value")
      .eq("key", SETTING_KEY)
      .single();

    const { error } = await supabase
      .from("settings")
      .update({ value: values.n8n_webhook_url, updated_at: new Date().toISOString() })
      .eq("key", SETTING_KEY)

    if (error) {
      toast({ title: "Erro ao salvar configuração", description: error.message, variant: "destructive" })
      await logActivity({
        action: 'UPDATE',
        tableName: 'settings',
        recordId: SETTING_KEY,
        oldData: { value: oldData?.value || null },
        newData: { value: values.n8n_webhook_url },
        isError: true,
        errorDetails: error,
        description: `Falha ao salvar configuração N8N: ${error.message}`
      });
    } else {
      toast({ title: "Configurações salvas com sucesso!" })
      await logActivity({
        action: 'UPDATE',
        tableName: 'settings',
        recordId: SETTING_KEY,
        oldData: { value: oldData?.value || null },
        newData: { value: values.n8n_webhook_url },
        description: `URL do Webhook N8N atualizada.`
      });
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as configurações e integrações do sistema.</p>
      </div>

      {/* Settings Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="bg-gradient-card shadow-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Link className="h-5 w-5 mr-2" />
                Integrações
              </CardTitle>
              <CardDescription>
                Configure webhooks para automações externas, como N8N.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="n8n_webhook_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL do Webhook N8N</FormLabel>
                    <FormControl>
                      <Input placeholder="https://seu-n8n.com/webhook/..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit">Salvar Alterações</Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
