import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface OrderFiltersProps {
  filters: {
    search: string;
    paymentStatus: string;
    deliveryStatus: string;
  };
  onFiltersChange: (filters: any) => void;
}

export default function OrderFilters({ filters, onFiltersChange }: OrderFiltersProps) {
  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      paymentStatus: "all",
      deliveryStatus: "all",
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-2">
            Поиск по названию
          </Label>
          <Input
            type="text"
            placeholder="Найти заказ..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
          />
        </div>
        
        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-2">
            Статус оплаты
          </Label>
          <Select value={filters.paymentStatus} onValueChange={(value) => handleFilterChange("paymentStatus", value === "all" ? "" : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Все статусы" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
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
          <Select value={filters.deliveryStatus} onValueChange={(value) => handleFilterChange("deliveryStatus", value === "all" ? "" : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Все статусы" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="pending">Ожидает</SelectItem>
              <SelectItem value="shipping">В пути</SelectItem>
              <SelectItem value="delivered">Доставлен</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-end">
          <Button
            variant="outline"
            onClick={clearFilters}
            className="w-full flex items-center space-x-2"
          >
            <X className="h-4 w-4" />
            <span>Очистить</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
