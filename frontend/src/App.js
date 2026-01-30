import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleBasedGuestRoute from "./components/RoleBasedGuestRoute";

// Páginas públicas
import Home from "./pages/Home";
import Login from "./pages/Login";
import LoginProveedor from "./pages/LoginProveedor";
import Register from "./pages/Register";
import RegisterProveedor from "./pages/RegisterProveedor";

// Páginas de cliente
import ExplorarServicios from "./pages/cliente/ExplorarServicios";
import HistorialSolicitudes from "./pages/cliente/HistorialSolicitudes";
import EditarDatos from "./pages/cliente/EditarDatos";
import MisListas from "./pages/cliente/MisListas";
import Preferencias from "./pages/cliente/Preferencias";
import ResenasPublicadas from "./pages/cliente/ResenasPublicadas";
import PerfilProveedor from "./pages/cliente/PerfilProveedor";

// Páginas de proveedor
import MiInformacion from "./pages/proveedor/MiInformacion";
import ServiciosPrecios from "./pages/proveedor/ServiciosPrecios";
import GaleriaFotos from "./pages/proveedor/GaleriaFotos";
import Promociones from "./pages/proveedor/Promociones";
import CalendarioDisponibilidad from "./pages/proveedor/CalendarioDisponibilidad";
import SolicitudesRecibidas from "./pages/proveedor/SolicitudesRecibidas";
import ResenasCalificaciones from "./pages/proveedor/ResenasCalificaciones";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta principal - CLIENTES y NO autenticados (bloquea PROVEEDORES) */}
          <Route
            path="/"
            element={
              <RoleBasedGuestRoute blockProveedores={true}>
                <Home />
              </RoleBasedGuestRoute>
            }
          />

          {/* Perfil de Proveedor - SOLO para CLIENTES autenticados */}
          <Route
            path="/perfil-proveedor/:id"
            element={
              <ProtectedRoute requiredRole="cliente">
                <PerfilProveedor />
              </ProtectedRoute>
            }
          />

          {/* Rutas de autenticación CLIENTE - SOLO para NO autenticados */}
          <Route
            path="/login"
            element={
              <RoleBasedGuestRoute allowedFor="cliente">
                <Login />
              </RoleBasedGuestRoute>
            }
          />
          <Route
            path="/register"
            element={
              <RoleBasedGuestRoute allowedFor="cliente">
                <Register />
              </RoleBasedGuestRoute>
            }
          />

          {/* Rutas de autenticación PROVEEDOR - SOLO para NO autenticados */}
          <Route
            path="/login-proveedor"
            element={
              <RoleBasedGuestRoute allowedFor="proveedor">
                <LoginProveedor />
              </RoleBasedGuestRoute>
            }
          />
          <Route
            path="/register-proveedor"
            element={
              <RoleBasedGuestRoute allowedFor="proveedor">
                <RegisterProveedor />
              </RoleBasedGuestRoute>
            }
          />

          {/* Rutas de Cliente */}
          <Route
            path="/cliente/explorar"
            element={
              <ProtectedRoute requiredRole="cliente">
                <ExplorarServicios />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cliente/cuenta/historial"
            element={
              <ProtectedRoute requiredRole="cliente">
                <HistorialSolicitudes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cliente/cuenta/datos"
            element={
              <ProtectedRoute requiredRole="cliente">
                <EditarDatos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cliente/cuenta/listas"
            element={
              <ProtectedRoute requiredRole="cliente">
                <MisListas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cliente/cuenta/preferencias"
            element={
              <ProtectedRoute requiredRole="cliente">
                <Preferencias />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cliente/cuenta/resenas"
            element={
              <ProtectedRoute requiredRole="cliente">
                <ResenasPublicadas />
              </ProtectedRoute>
            }
          />

          {/* Rutas de Proveedor */}
          <Route
            path="/proveedor/cuenta/informacion"
            element={
              <ProtectedRoute requiredRole="proveedor">
                <MiInformacion />
              </ProtectedRoute>
            }
          />
          <Route
            path="/proveedor/cuenta/servicios"
            element={
              <ProtectedRoute requiredRole="proveedor">
                <ServiciosPrecios />
              </ProtectedRoute>
            }
          />
          <Route
            path="/proveedor/cuenta/galeria"
            element={
              <ProtectedRoute requiredRole="proveedor">
                <GaleriaFotos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/proveedor/cuenta/promociones"
            element={
              <ProtectedRoute requiredRole="proveedor">
                <Promociones />
              </ProtectedRoute>
            }
          />
          <Route
            path="/proveedor/cuenta/calendario"
            element={
              <ProtectedRoute requiredRole="proveedor">
                <CalendarioDisponibilidad />
              </ProtectedRoute>
            }
          />
          <Route
            path="/proveedor/cuenta/solicitudes"
            element={
              <ProtectedRoute requiredRole="proveedor">
                <SolicitudesRecibidas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/proveedor/cuenta/resenas"
            element={
              <ProtectedRoute requiredRole="proveedor">
                <ResenasCalificaciones />
              </ProtectedRoute>
            }
          />

          {/* Ruta 404 */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
