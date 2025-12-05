import { 
  Database, 
  LayoutDashboard, 
  Network, 
  Settings, 
  FileText,
  AlertTriangle,
  BarChart3,
  Users,
  Search,
  Plus
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useSearch } from "@/hooks/use-search"

const mainItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Itens de Configuração", url: "/configuration-items", icon: Database },
  { title: "Relacionamentos", url: "/relationships", icon: Network },
  { title: "Relatórios", url: "/reports", icon: BarChart3 },
]

const managementItems = [
  { title: "Incidentes", url: "/incidents", icon: AlertTriangle },
  { title: "Mudanças", url: "/changes", icon: FileText },
  { title: "Usuários", url: "/users", icon: Users },
  { title: "Configurações", url: "/settings", icon: Settings },
]

export function AppSidebar() {
  const { open } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const { onOpen } = useSearch()

  const isActive = (path: string) => currentPath === path
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-nexus-surface text-nexus-primary font-medium border-l-2 border-nexus-primary" 
      : "hover:bg-nexus-surface-hover text-nexus-secondary hover:text-nexus-primary transition-all duration-200"

  return (
    <Sidebar
      className={`${!open ? "w-16" : "w-64"} border-r border-sidebar-border bg-sidebar transition-all duration-300`}
      collapsible="icon"
    >
      <SidebarContent className="p-4">
        {/* Logo */}
        <div className="mb-8 flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
            <Database className="h-6 w-6 text-nexus-primary" />
          </div>
          {open && (
            <div>
              <h1 className="text-xl font-bold text-nexus-primary">Nexus</h1>
              <p className="text-xs text-nexus-secondary">CMDB System</p>
            </div>
          )}
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-nexus-secondary text-xs font-semibold uppercase tracking-wider mb-2">
            {open ? "Principal" : ""}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={getNavCls}
                    >
                      <item.icon className="h-5 w-5 mr-3" />
                      {open && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Management Section */}
        <SidebarGroup className="mt-8">
          <SidebarGroupLabel className="text-nexus-secondary text-xs font-semibold uppercase tracking-wider mb-2">
            {open ? "Gerenciamento" : ""}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {managementItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={getNavCls}
                    >
                      <item.icon className="h-5 w-5 mr-3" />
                      {open && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Quick Actions */}
        {open && (
          <div className="mt-8 space-y-2">
            <button 
              onClick={onOpen}
              className="w-full flex items-center space-x-2 p-2 rounded-lg border border-nexus-surface text-nexus-secondary hover:bg-nexus-surface hover:text-nexus-primary transition-all duration-200"
            >
              <Search className="h-4 w-4" />
              <span className="text-sm">Buscar</span>
            </button>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  )
}
