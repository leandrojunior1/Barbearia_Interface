import { createBrowserRouter } from "react-router";
import HomePage from "./pages/HomePage";
import BookingPage from "./pages/BookingPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import AdminPage from "./pages/AdminPage";
import ContatoPage from "./pages/ContatoPage";
import SuportePage from "./pages/SuportePage";

export const router = createBrowserRouter([
  { path: "/", Component: HomePage },
  { path: "/booking/:slug", Component: BookingPage },
  { path: "/login", Component: LoginPage },
  { path: "/dashboard/:storeId", Component: DashboardPage },
  { path: "/admin", Component: AdminPage },
  { path: "/contato", Component: ContatoPage },
  { path: "/suporte", Component: SuportePage },
]);
