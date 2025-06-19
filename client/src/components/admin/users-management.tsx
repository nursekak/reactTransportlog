import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { User, UserStatus } from "@shared/schema";

const statusLabels = {
  pending: "Ожидает",
  approved: "Одобрен",
  rejected: "Отклонен",
};

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export default function UsersManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: number; status: UserStatus }) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${userId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Успешно",
        description: "Статус пользователя обновлен",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить статус",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (userId: number, status: UserStatus) => {
    updateUserStatusMutation.mutate({ userId, status });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-500">Загрузка пользователей...</p>
        </div>
      </div>
    );
  }

  const pendingUsers = users.filter(user => user.status === "pending");
  const approvedUsers = users.filter(user => user.status === "approved");
  const rejectedUsers = users.filter(user => user.status === "rejected");

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ожидают одобрения</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingUsers.length}</p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-yellow-600 font-bold">{pendingUsers.length}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Одобренные</p>
              <p className="text-2xl font-bold text-green-600">{approvedUsers.length}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 font-bold">{approvedUsers.length}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Отклоненные</p>
              <p className="text-2xl font-bold text-red-600">{rejectedUsers.length}</p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-red-600 font-bold">{rejectedUsers.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Управление пользователями <span className="text-gray-500">({users.length})</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Дата регистрации</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="font-medium text-gray-900">{user.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[user.status as keyof typeof statusColors]}>
                      {statusLabels[user.status as keyof typeof statusLabels]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-900">
                    {format(new Date(user.createdAt), "dd.MM.yyyy HH:mm", { locale: ru })}
                  </TableCell>
                  <TableCell>
                    <Select 
                      value={user.status} 
                      onValueChange={(value: UserStatus) => handleStatusChange(user.id, value)}
                      disabled={updateUserStatusMutation.isPending}
                    >
                      <SelectTrigger className="w-[140px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Ожидает</SelectItem>
                        <SelectItem value="approved">Одобрить</SelectItem>
                        <SelectItem value="rejected">Отклонить</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
} 