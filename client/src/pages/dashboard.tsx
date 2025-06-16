import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Truck, Plus, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProjectSelector from "@/components/projects/project-selector";
import CreateProjectModal from "@/components/projects/create-project-modal";
import OrdersTable from "@/components/orders/orders-table";
import CreateOrderModal from "@/components/orders/create-order-modal";
import EditOrderModal from "@/components/orders/edit-order-modal";
import OrderFilters from "@/components/orders/order-filters";
import type { Project } from "@shared/schema";

export default function DashboardPage() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [editingOrder, setEditingOrder] = useState<number | null>(null);
  const [filters, setFilters] = useState({
    search: "",
    paymentStatus: "all",
    deliveryStatus: "all",
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
    enabled: !!user,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [user, authLoading, setLocation]);

  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      // Find the project that was last selected or use the first one
      const lastSelectedId = localStorage.getItem('lastSelectedProjectId');
      const lastProject = lastSelectedId ? projects.find(p => p.id === parseInt(lastSelectedId)) : null;
      setSelectedProject(lastProject || projects[0]);
    }
  }, [projects, selectedProject]);

  // Save selected project to localStorage
  useEffect(() => {
    if (selectedProject) {
      localStorage.setItem('lastSelectedProjectId', selectedProject.id.toString());
    }
  }, [selectedProject]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                  <Truck className="text-white h-5 w-5" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900">Логистика</h1>
              </div>
              
              <div className="ml-8">
                <ProjectSelector
                  projects={projects}
                  selectedProject={selectedProject}
                  onProjectChange={setSelectedProject}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setShowCreateProject(true)}
                className="bg-primary text-white hover:bg-primary/90 flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Новый проект</span>
              </Button>
              
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-700">{user.email}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedProject ? (
          <div className="space-y-6">
            {/* Project Header */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {selectedProject.name}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {selectedProject.description}
                  </p>
                </div>
                <Button
                  onClick={() => setShowCreateOrder(true)}
                  className="bg-primary text-white hover:bg-primary/90 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Добавить заказ</span>
                </Button>
              </div>
            </div>

            {/* Filters */}
            <OrderFilters filters={filters} onFiltersChange={setFilters} />

            {/* Orders Table */}
            <OrdersTable
              projectId={selectedProject.id}
              filters={filters}
              onEditOrder={setEditingOrder}
            />
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">Выберите проект для просмотра заказов</p>
          </div>
        )}
      </main>

      {/* Modals */}
      <CreateProjectModal
        open={showCreateProject}
        onClose={() => setShowCreateProject(false)}
      />
      
      {selectedProject && (
        <CreateOrderModal
          open={showCreateOrder}
          onClose={() => setShowCreateOrder(false)}
          projectId={selectedProject.id}
        />
      )}

      {editingOrder && (
        <EditOrderModal
          orderId={editingOrder}
          open={!!editingOrder}
          onClose={() => setEditingOrder(null)}
        />
      )}
    </div>
  );
}
