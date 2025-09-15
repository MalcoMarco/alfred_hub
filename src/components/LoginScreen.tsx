import React, { useState } from "react";
import { motion } from "framer-motion";
import AlfredLogo from "../assets/alfred-logo.png";
import { authService } from "../services/auth";

interface LoginScreenProps {
  onAuth: (token: string) => void;
}

interface LoginFormData {
  email: string;
  password: string;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onAuth }) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error al escribir
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      // Usar el servicio de autenticación
      const response = await authService.login({
        email: formData.email,
        password: formData.password
      });

      // El servicio ya maneja el guardado del token
      onAuth(response.token);
    } catch (err: any) {
      console.error('Error de login:', err);
      setError(err.message || 'Error de autenticación');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2" style={{ background: "#0f1020" }}>
      {/* Izquierda */}
      <div className="relative hidden items-center justify-center p-10 md:flex">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md"
        >
          <div className="text-3xl font-bold leading-tight text-white">
            Beyond Banking — <span className="text-white/80">Seamless. Scalable. Compliant.</span>
          </div>
          <p className="mt-4 text-white/70">
            Accede al Portal de Cumplimiento para gestionar KYC/KYB, políticas, evidencias, auditorías y monitoreo.
          </p>
        </motion.div>
      </div>

      {/* Derecha */}
      <div className="flex items-center justify-center bg-white p-8 md:p-12">
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="w-full max-w-sm text-center"
        >
          <div className="mb-4 flex justify-center">
            <img 
              src={AlfredLogo} 
              alt="AlfredPay Logo" 
              className="h-14 w-auto select-none object-contain" 
              draggable={false} 
            />
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900">AlfredPay® Compliance</h1>
          <p className="text-gray-500">Inicia sesión para continuar</p>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="sr-only" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-base placeholder-gray-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="email"
              placeholder="Email"
              autoComplete="email"
              required
              autoFocus
              value={formData.email}
              onChange={handleInputChange}
              disabled={submitting}
            />
            
            <label className="sr-only" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-base placeholder-gray-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="password"
              placeholder="Password"
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={handleInputChange}
              disabled={submitting}
            />
            
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl py-2.5 font-semibold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-70"
              style={{ background: "#0F2A6B" }}
            >
              {submitting ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginScreen;