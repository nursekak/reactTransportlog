import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import LoginForm from "@/components/auth/login-form";
import RegisterForm from "@/components/auth/register-form";
import { useState } from "react";
import { Truck } from "lucide-react";

export default function LoginPage() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  useEffect(() => {
    if (user && !isLoading) {
      setLocation("/dashboard");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary rounded-xl flex items-center justify-center mb-6">
            <Truck className="text-white h-8 w-8" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Логистика заказов</h2>
          <p className="mt-2 text-gray-600">
            {isRegisterMode ? "Создайте аккаунт для управления заказами" : "Войдите в систему управления заказами"}
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-8">
          {isRegisterMode ? (
            <RegisterForm onToggleMode={() => setIsRegisterMode(false)} />
          ) : (
            <LoginForm onToggleMode={() => setIsRegisterMode(true)} />
          )}
        </div>
      </div>
    </div>
  );
}
