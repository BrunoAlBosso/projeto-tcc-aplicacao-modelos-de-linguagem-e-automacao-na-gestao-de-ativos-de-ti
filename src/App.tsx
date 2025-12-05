import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import ConfigurationItems from "./pages/ConfigurationItems";
import Users from "./pages/Users";
import Incidents from "./pages/Incidents";
import Settings from "./pages/Settings";
import { RelationshipsPage } from "./pages/Relationships";
import { ChangesPage } from "./pages/Changes";
import { Reports } from "./pages/Reports";
import NotFound from "./pages/NotFound";
import { NotificationsProvider } from "./hooks/use-notifications";
import { SearchProvider } from "./hooks/use-search";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <NotificationsProvider>
        <SearchProvider>
          <div className="dark">
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/configuration-items" element={<ConfigurationItems />} />
                  <Route path="/relationships" element={<RelationshipsPage />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/incidents" element={<Incidents />} />
                  <Route path="/changes" element={<ChangesPage />} />
                  <Route path="/users" element={<Users />} />
                  <Route path="/settings" element={<Settings />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            </BrowserRouter>
          </div>
        </SearchProvider>
      </NotificationsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
