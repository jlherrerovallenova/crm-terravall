import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'

import { DashboardLayout } from './layouts/DashboardLayout'
import { PropertiesPage } from './pages/PropertiesPage'
import { NewPropertyPage } from './pages/NewPropertyPage'
import { PropertyDetailPage } from './pages/PropertyDetailPage'
import { EditPropertyPage } from './pages/EditPropertyPage'

function App() {
  const [session, setSession] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthChecked(true)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      const { error: signUpError } = await supabase.auth.signUp({ email, password })
      if (signUpError) alert(signUpError.message)
      else alert("Usuario registrado. Por favor revisa tu email o deshabilita la confirmación de email en Supabase.")
    }
    setLoading(false)
  }

  if (!authChecked) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Cargando...</div>
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-sm w-full space-y-4">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Terravall CRM</h1>
            <p className="text-slate-500 text-sm mt-1">Acceso para agentes</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" required />
          </div>
          <button disabled={loading} className="w-full bg-blue-600 text-white rounded-lg p-2.5 mt-6 font-medium hover:bg-blue-700 transition-colors disabled:opacity-70">
            {loading ? 'Cargando...' : 'Entrar / Registrar'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout userEmail={session.user.email} />}>
          <Route path="/" element={<Navigate to="/inmuebles" replace />} />
          <Route path="/inmuebles" element={<PropertiesPage />} />
          <Route path="/inmuebles/nuevo" element={<NewPropertyPage />} />
          <Route path="/inmuebles/:id" element={<PropertyDetailPage />} />
          <Route path="/inmuebles/:id/editar" element={<EditPropertyPage />} />
          {/* Mock routes for demonstration */}
          <Route path="/configuracion" element={<div className="p-8">Configuración del sistema</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
