import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import MobileTabBar from './components/MobileTabBar';
import ToastHost from './components/ui/ToastHost';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';

import Library from './pages/Library';
import BuildDetail from './pages/BuildDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import Favorites from './pages/Favorites';
import NotFound from './pages/NotFound';

import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import BuildsManage from './pages/admin/BuildsManage';
import BuildEditor from './pages/admin/BuildEditor';
import CategoriesManage from './pages/admin/CategoriesManage';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col pb-14 md:pb-0">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Library />} />
          <Route path="/builds/:slug" element={<BuildDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/favorites" element={<Favorites />} />
          </Route>

          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="builds" element={<BuildsManage />} />
              <Route path="builds/new" element={<BuildEditor />} />
              <Route path="builds/:id" element={<BuildEditor />} />
              <Route path="categories" element={<CategoriesManage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <MobileTabBar />
      <ToastHost />
    </div>
  );
}
