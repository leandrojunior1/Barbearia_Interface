import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router";

interface HeaderProps {
  loggedIn?: boolean;
  userName?: string;
  userPhoto?: string;
}

export default function Header({ loggedIn = false, userName = "Ana Costa", userPhoto }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const goToServices = () => {
    if (location.pathname === "/") {
      const target = document.getElementById("destaques");
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    navigate("/");
    window.setTimeout(() => {
      const target = document.getElementById("destaques");
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-16 gap-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: "#2F6B6B" }}>
            i
          </span>
          <span className="font-display font-semibold text-lg text-gray-900" style={{ fontFamily: "var(--font-display)" }}>
            iService
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-6 ml-4 flex-1">
          <Link to="/" className="text-sm font-medium text-gray-600 hover:text-brand transition-colors">Início</Link>
          <button type="button" onClick={goToServices} className="text-sm font-medium text-gray-600 hover:text-brand transition-colors">Serviços</button>
          <Link to="/categorias" className="text-sm font-medium text-gray-600 hover:text-brand transition-colors">Categorias</Link>
          <Link to="/contato" className="text-sm font-medium text-gray-600 hover:text-brand transition-colors">Contato</Link>
        </nav>

        {/* Auth area */}
        <div className="ml-auto flex items-center gap-3">
          {loggedIn ? (
            <button className="flex items-center gap-2 rounded-full hover:bg-gray-50 px-3 py-1.5 transition-colors">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-brand flex items-center justify-center text-white text-sm font-medium">
                {userPhoto ? <img src={userPhoto} alt={userName} className="w-full h-full object-cover" /> : userName[0]}
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:block">{userName}</span>
            </button>
          ) : (
            <>
              <button onClick={() => navigate("/login")} className="text-sm font-medium text-gray-700 hover:text-brand transition-colors px-3 py-2">
                Entrar
              </button>
              <button onClick={() => navigate("/login")} className="text-sm font-medium text-white px-4 py-2 rounded-xl transition-colors" style={{ background: "#2F6B6B" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#234F4F")}
                onMouseLeave={e => (e.currentTarget.style.background = "#2F6B6B")}>
                Criar conta
              </button>
            </>
          )}
          {/* Mobile menu toggle */}
          <button className="md:hidden p-2 text-gray-600" onClick={() => setMobileOpen(o => !o)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 flex flex-col gap-3">
          <Link to="/" className="text-sm font-medium text-gray-700" onClick={() => setMobileOpen(false)}>Início</Link>
          <button type="button" onClick={() => { setMobileOpen(false); goToServices(); }} className="text-left text-sm font-medium text-gray-700">Serviços</button>
          <Link to="/categorias" className="text-sm font-medium text-gray-700" onClick={() => setMobileOpen(false)}>Categorias</Link>
          <Link to="/contato" className="text-sm font-medium text-gray-700" onClick={() => setMobileOpen(false)}>Contato</Link>
        </div>
      )}
    </header>
  );
}
