import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { ProtectedRoute } from './components/ProtectedRoute'
import { DashboardLayout } from './layouts/DashboardLayout'
import { PublicLayout } from './layouts/PublicLayout'
import { PageLoader } from './components/common/PageLoader'

// Lazy-loaded Login Page
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })))

// Lazy-loaded CRM Pages
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const PropertiesPage = lazy(() => import('./pages/PropertiesPage').then(m => ({ default: m.PropertiesPage })))
const NewPropertyPage = lazy(() => import('./pages/NewPropertyPage').then(m => ({ default: m.NewPropertyPage })))
const PropertyDetailPage = lazy(() => import('./pages/PropertyDetailPage').then(m => ({ default: m.PropertyDetailPage })))
const EditPropertyPage = lazy(() => import('./pages/EditPropertyPage').then(m => ({ default: m.EditPropertyPage })))
const ConfiguracionPage = lazy(() => import('./pages/ConfiguracionPage').then(m => ({ default: m.ConfiguracionPage })))
const ValuationsPage = lazy(() => import('./pages/ValuationsPage').then(m => ({ default: m.ValuationsPage })))
const SimuladorPage = lazy(() => import('./pages/SimuladorPage').then(m => ({ default: m.SimuladorPage })))

// Lazy-loaded Public Pages
const PublicHomePage = lazy(() => import('./pages/PublicHomePage').then(m => ({ default: m.PublicHomePage })))
const PublicPropertiesPage = lazy(() => import('./pages/PublicPropertiesPage').then(m => ({ default: m.PublicPropertiesPage })))
const PublicPropertyDetail = lazy(() => import('./pages/PublicPropertyDetail').then(m => ({ default: m.PublicPropertyDetail })))

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
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
              <Route path="valoraciones" element={<ValuationsPage />} />
              <Route path="simulador" element={<SimuladorPage />} />
              <Route path="configuracion" element={<ConfiguracionPage />} />
            </Route>
          </Route>
          
          {/* FALLBACK */}
          <Route path="*" element={<Navigate to="/crm" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
