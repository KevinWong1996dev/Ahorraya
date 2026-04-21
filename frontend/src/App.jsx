import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import AdminLayout from './components/admin/AdminLayout';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import { Login, Register } from './pages/Login';
import Profile from './pages/Profile';
import Contribute from './pages/Contribute';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProductos from './pages/admin/AdminProductos';
import AdminUsuarios from './pages/admin/AdminUsuarios';
import { AdminContribuciones, AdminLogs } from './pages/admin/AdminContribuciones';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="producto/:id" element={<ProductDetail />} />
          <Route path="carrito" element={<Cart />} />
          <Route path="login" element={<Login />} />
          <Route path="registro" element={<Register />} />
          <Route path="perfil" element={<Profile />} />
          <Route path="contribuir" element={<Contribute />} />
        </Route>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="productos" element={<AdminProductos />} />
          <Route path="usuarios" element={<AdminUsuarios />} />
          <Route path="contribuciones" element={<AdminContribuciones />} />
          <Route path="logs" element={<AdminLogs />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}