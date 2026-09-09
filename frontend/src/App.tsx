import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";
import { Dashboard } from "./pages/Dashboard";
import { ProjectsPage } from "./pages/projects/ProjectsPage";
import { ProjectForm } from "./pages/projects/ProjectForm";
import Login from "./pages/Login";
import { UserForm } from "./pages/users/UserForm";
import { UsersPage } from "./pages/users/UsersPage";
import { ManagePermissions } from "./pages/users/ManagePermissions";
import { TenantsPage } from "./pages/tenants/TenantsPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/new" element={<ProjectForm mode="create" />} />
              <Route path="/projects/:id/edit" element={<ProjectForm mode="edit" />} />
               <Route path="/users" element={<UsersPage />} />
              <Route path="/users/new/admin" element={<UserForm mode="create" fixedRole="ADMIN" />} />
              <Route path="/users/new/agent" element={<UserForm mode="create" fixedRole="AGENT" />} />
              <Route path="/users/:id/edit" element={<UserForm mode="edit" />} />
              <Route path="/users/:id/permissions" element={<ManagePermissions />} />
              <Route path="/permissions" element={<div>Permissions</div>} />
              <Route path="/tenants" element={<TenantsPage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}