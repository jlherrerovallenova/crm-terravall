import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) {
        alert(signUpError.message);
      } else {
        alert("Usuario registrado. Por favor revisa tu email o deshabilita la confirmación de email en Supabase.");
      }
    } else {
      navigate('/crm/inmuebles');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-sm w-full space-y-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Terravall CRM</h1>
          <p className="text-slate-500 text-sm mt-1">Acceso para agentes</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" required />
        </div>
        <button disabled={loading} className="w-full bg-primary text-white rounded-xl p-2.5 mt-6 font-semibold hover:bg-primary/95 transition-all shadow-md shadow-primary/10 disabled:opacity-70 cursor-pointer">
          {loading ? 'Cargando...' : 'Entrar / Registrar'}
        </button>
      </form>
    </div>
  );
};
