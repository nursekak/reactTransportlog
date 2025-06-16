import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface EditOrderModalProps {
  orderId: number;
  open: boolean;
  onClose: () => void;
}

export default function EditOrderModal({ orderId, open, onClose }: EditOrderModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("unpaid");
  const [deliveryStatus, setDeliveryStatus] = useState("pending");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: [`/api/orders/${orderId}`],
    enabled: open && !!orderId,
    retry: false,
  });

  const updateOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PATCH", `/api/orders/${orderId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Успешно",
        description: "Заказ успешно обновлен",
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить заказ",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (order) {
      setTitle(order.title || "");
      setDescription(order.description || "");
      setProductUrl(order.productUrl || "");
      setPaymentStatus(order.paymentStatus || "unpaid");
      setDeliveryStatus(order.deliveryStatus || "pending");
    }
  }, [order]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Ошибка",
        description: "Название заказа обязательно",
        variant: "destructive",
      });
      return;
    }

    updateOrderMutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      productUrl: productUrl.trim() || undefined,
      paymentStatus,
      deliveryStatus,
    });
  };

  const handleClose = () => {
    onClose();
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-500">Загрузка заказа...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Редактировать заказ</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Название заказа <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Введите название заказа"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Описание
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Описание заказа (опционально)"
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="productUrl" className="block text-sm font-medium text-gray-700 mb-2">
              Ссылка на товар
            </Label>
            <Input
              type="url"
              id="productUrl"
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
              placeholder="https://example.com/product"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Статус оплаты
              </Label>
              <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpaid">Не оплачен</SelectItem>
                  <SelectItem value="partial">Частично</SelectItem>
                  <SelectItem value="paid">Полностью</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Статус доставки
              </Label>
              <Select value={deliveryStatus} onValueChange={setDeliveryStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Ожидает</SelectItem>
                  <SelectItem value="shipping">В пути</SelectItem>
                  <SelectItem value="delivered">Доставлен</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={updateOrderMutation.isPending}
              className="bg-primary text-white hover:bg-primary/90"
            >
              {updateOrderMutation.isPending ? "Сохранение..." : "Сохранить изменения"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
