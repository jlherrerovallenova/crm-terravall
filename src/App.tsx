import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'

// CRM Pages
import { DashboardLayout } from './layouts/DashboardLayout'
import { DashboardPage } from './pages/DashboardPage'
import { PropertiesPage } from './pages/PropertiesPage'
import { NewPropertyPage } from './pages/NewPropertyPage'
import { PropertyDetailPage } from './pages/PropertyDetailPage'
import { EditPropertyPage } from './pages/EditPropertyPage'
import { ConfiguracionPage } from './pages/ConfiguracionPage'

// Public Pages
import { PublicLayout } from './layouts/PublicLayout'
import { PublicHomePage } from './pages/PublicHomePage'
import { PublicPropertiesPage } from './pages/PublicPropertiesPage'
import { PublicPropertyDetail } from './pages/PublicPropertyDetail'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ROOT REDIRECT */}
        <Route path="/" element={<Navigate to="/crm" replace />} />

        {/* PUBLIC ROUTES */}
        <Route path="/web" element={<PublicLayout />}>
          <Route index element={<PublicHomePage />} />
          <Route path="propiedades" element={<PublicPropertiesPage />} />
          <Route path="propiedades/:id" element={<PublicPropertyDetail />} />
        </Route>

        {/* LOGIN */}
        <Route path="/crm/login" element={<LoginPage />} />

        {/* CRM PROTECTED ROUTES */}
        <Route path="/crm" element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="inmuebles" element={<PropertiesPage />} />
            <Route path="inmuebles/nuevo" element={<NewPropertyPage />} />
            <Route path="inmuebles/:id" element={<PropertyDetailPage />} />
            <Route path="inmuebles/:id/editar" element={<EditPropertyPage />} />
            <Route path="configuracion" element={<ConfiguracionPage />} />
          </Route>
        </Route>
        
        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/crm" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
