import { createElement } from "react";
import { createBrowserRouter, Link, Navigate, Outlet, useParams } from "react-router";
import HomePage from "./pages/HomePage";
import BookingPage from "./pages/BookingPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import AdminPage from "./pages/AdminPage";
import ContatoPage from "./pages/ContatoPage";
import CategoriasPage from "./pages/CategoriasPage";
import SuportePage from "./pages/SuportePage";
import ClientProfilePage from "./pages/ClientProfilePage";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { sessionRepo, storeRepo } from "./lib/db";

function isAdminSession(session: ReturnType<typeof sessionRepo.get>) {
  if (!session) return false;
  const normalizedName = session.name?.trim().toLowerCase();
  return session.type === "admin" || normalizedName === "adm" || normalizedName === "super admin";
}

function DashboardGuard() {
  const { storeId } = useParams();
  const session = sessionRepo.get();

  if (!session) {
    return createElement(Navigate, { to: "/login", replace: true });
  }

  if (isAdminSession(session)) {
    const store = storeId ? storeRepo.getById(storeId) : undefined;
    if (!store) {
      return createElement(Navigate, { to: "/admin", replace: true });
    }
    return createElement(Outlet);
  }

  if (session.type !== "lojista") {
    return createElement(Navigate, { to: "/login", replace: true });
  }
  if (!storeId || session.storeId?.toLowerCase() !== storeId.toLowerCase()) {
    return createElement(Navigate, { to: "/", replace: true });
  }
  if (!storeRepo.isAvailable(storeId)) {
    return createElement(Navigate, { to: "/login", replace: true });
  }

  return createElement(Outlet);
}

function AdminGuard() {
  const session = sessionRepo.get();
  if (!isAdminSession(session)) {
    return createElement(Navigate, { to: "/login", replace: true });
  }
  return createElement(Outlet);
}

function NotFoundPage() {
  return createElement(
    "div",
    { className: "min-h-screen flex flex-col bg-gray-50" },
    createElement(Header),
    createElement(
      "main",
      { className: "flex-1 flex flex-col items-center justify-center px-4 py-24 text-center" },
      createElement("h1", { className: "text-6xl font-bold text-[#2F6B6B] mb-4" }, "404"),
      createElement("h2", { className: "text-2xl font-bold text-gray-900 mb-2" }, "Página não encontrada"),
      createElement(
        "p",
        { className: "text-sm text-gray-500 mb-8 max-w-sm" },
        "A página que você está procurando não existe ou foi removida.",
      ),
      createElement(
        Link,
        {
          to: "/",
          className: "px-6 py-3 rounded-xl bg-[#2F6B6B] text-white text-sm font-semibold shadow-sm hover:opacity-90",
        },
        "Voltar ao início",
      ),
    ),
    createElement(Footer),
  );
}

export const router = createBrowserRouter([
  { path: "/", Component: HomePage },
  { path: "/booking/:slug", Component: BookingPage },
  { path: "/login", Component: LoginPage },
  {
    element: createElement(DashboardGuard),
    children: [{ path: "/dashboard/:storeId", Component: DashboardPage }],
  },
  {
    element: createElement(AdminGuard),
    children: [{ path: "/admin", Component: AdminPage }],
  },
  { path: "/contato", Component: ContatoPage },
  { path: "/categorias", Component: CategoriasPage },
  { path: "/suporte", Component: SuportePage },
  { path: "/perfil", Component: ClientProfilePage },
  { path: "/cliente/agendamentos", Component: ClientProfilePage },
  { path: "*", Component: NotFoundPage },
]);
