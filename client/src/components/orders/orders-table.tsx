import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Trash2, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { Order } from "@shared/schema";

interface OrdersTableProps {
  projectId: number;
  filters: {
    search: string;
    paymentStatus: string;
    deliveryStatus: string;
  };
  onEditOrder: (orderId: number) => void;
}

const paymentStatusLabels = {
  unpaid: "Не оплачен",
  partial: "Частично",
  paid: "Полностью",
};

const deliveryStatusLabels = {
  pending: "Ожидает",
  shipping: "В пути",
  delivered: "Доставлен",
};

export default function OrdersTable({ projectId, filters, onEditOrder }: OrdersTableProps) {
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const queryParams = new URLSearchParams({
    projectId: projectId.toString(),
    page: page.toString(),
    limit: "20",
    ...(filters.search && { search: filters.search }),
    ...(filters.paymentStatus && filters.paymentStatus !== "all" && { paymentStatus: filters.paymentStatus }),
    ...(filters.deliveryStatus && filters.deliveryStatus !== "all" && { deliveryStatus: filters.deliveryStatus }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["/api/orders", projectId, filters.search, filters.paymentStatus, filters.deliveryStatus, page],
    queryFn: async () => {
      const response = await fetch(`/api/orders?${queryParams}`);
      if (!response.ok) throw new Error("Failed to fetch orders");
      return response.json();
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, field, value }: { orderId: number; field: string; value: string }) => {
      const response = await apiRequest("PATCH", `/api/orders/${orderId}`, { [field]: value });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders", projectId, filters.search, filters.paymentStatus, filters.deliveryStatus, page] });
      toast({
        title: "Успешно",
        description: "Статус обновлен",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус",
        variant: "destructive",
      });
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      await apiRequest("DELETE", `/api/orders/${orderId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Успешно",
        description: "Заказ успешно удален",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить заказ",
        variant: "destructive",
      });
    },
  });

  const handleDeleteOrder = (orderId: number) => {
    if (window.confirm("Вы уверены, что хотите удалить этот заказ?")) {
      deleteOrderMutation.mutate(orderId);
    }
  };

  const handleStatusChange = (orderId: number, field: string, value: string) => {
    updateOrderStatusMutation.mutate({ orderId, field, value });
  };

  const StatusSelector = ({ order, type }: { order: Order; type: "payment" | "delivery" }) => {
    const currentValue = type === "payment" ? order.paymentStatus : order.deliveryStatus;
    const field = type === "payment" ? "paymentStatus" : "deliveryStatus";
    const options = type === "payment" 
      ? [
          { value: "unpaid", label: "Не оплачен" },
          { value: "partial", label: "Частично" },
          { value: "paid", label: "Полностью" }
        ]
      : [
          { value: "pending", label: "Ожидает" },
          { value: "shipping", label: "В пути" },
          { value: "delivered", label: "Доставлен" }
        ];

    return (
      <Select 
        value={currentValue} 
        onValueChange={(value) => handleStatusChange(order.id, field, value)}
        disabled={updateOrderStatusMutation.isPending}
      >
        <SelectTrigger className="w-[120px] h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-500">Загрузка заказов...</p>
        </div>
      </div>
    );
  }

  const orders = data?.orders || [];
  const pagination = data?.pagination || {};

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Заказы <span className="text-gray-500">({pagination.total || 0})</span>
          </h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>Сортировка:</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
              className="text-primary hover:text-primary/80 font-medium"
            >
              По дате {sortOrder === "desc" ? "↓" : "↑"}
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>Описание</TableHead>
              <TableHead>Номер счета</TableHead>
              <TableHead>Дата</TableHead>
              <TableHead>Оплата</TableHead>
              <TableHead>Доставка</TableHead>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order: Order) => (
              <TableRow key={order.id} className="hover:bg-gray-50">
                <TableCell>
                  <div className="font-medium text-gray-900">{order.title}</div>
                  {order.productUrl && (
                    <div className="text-sm text-gray-500 mt-1">
                      <a
                        href={order.productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 flex items-center space-x-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>Ссылка на товар</span>
                      </a>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-900 max-w-xs truncate">
                    {order.description || "—"}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-gray-900">
                  {order.invoiceNumber || "—"}
                </TableCell>
                <TableCell className="text-sm text-gray-900">
                  {format(new Date(order.createdAt), "dd.MM.yyyy", { locale: ru })}
                </TableCell>
                <TableCell>
                  <StatusSelector order={order} type="payment" />
                </TableCell>
                <TableCell>
                  <StatusSelector order={order} type="delivery" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditOrder(order.id)}
                      className="text-primary hover:text-primary/80"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteOrder(order.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden">
        {orders.map((order: Order) => (
          <div key={order.id} className="p-4 border-b border-gray-200 last:border-b-0">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{order.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {order.description || "—"}
                  </p>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditOrder(order.id)}
                    className="text-primary hover:text-primary/80"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteOrder(order.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  {format(new Date(order.createdAt), "dd.MM.yyyy", { locale: ru })}
                </span>
                {order.productUrl && (
                  <a
                    href={order.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 flex items-center space-x-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>Товар</span>
                  </a>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                <StatusSelector order={order} type="payment" />
                <StatusSelector order={order} type="delivery" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Показано{" "}
            <span className="font-medium">
              {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total) || 0}-
              {Math.min(pagination.page * pagination.limit, pagination.total) || 0}
            </span>{" "}
            из <span className="font-medium">{pagination.total || 0}</span> заказов
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-700">{page}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= (pagination.pages || 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
