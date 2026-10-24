import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { bookingRepo, sessionRepo, type Session } from "../lib/db";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeCount, setActiveCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const currentSession = sessionRepo.get();
    setSession(currentSession);
    setDropdownOpen(false);

    if (currentSession?.type === "client" && currentSession.name) {
      const count = bookingRepo
        .getAll()
        .filter(
          (booking) =>
            booking.clientName.toLowerCase() === currentSession.name.toLowerCase() &&
            booking.status === "confirmado",
        ).length;
      setActiveCount(count);
    } else {
      setActiveCount(0);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    sessionRepo.clear();
    setSession(null);
    setActiveCount(0);
    setDropdownOpen(false);
    navigate("/");
  };

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
        <div className="ml-auto flex items-center gap-3 relative">
          {session ? (
            <div className="flex items-center gap-3">
              {session.type === "client" && (
                <Link
                  to="/cliente/agendamentos"
                  className="relative px-3 py-1.5 text-xs font-semibold text-[#2F6B6B] bg-[#EBF3F3] hover:bg-[#dbeaea] rounded-xl transition-colors flex items-center gap-1.5"
                >
                  Meus Agendamentos
                  {activeCount > 0 && (
                    <span
                      aria-label={`${activeCount} agendamentos confirmados`}
                      className="w-5 h-5 rounded-full bg-[#2F6B6B] text-white text-[10px] flex items-center justify-center font-bold"
                    >
                      {activeCount}
                    </span>
                  )}
                </Link>
              )}

              <div className="relative">
                <button
                  type="button"
                  aria-expanded={dropdownOpen}
                  onClick={() => setDropdownOpen((open) => !open)}
                  className="flex items-center gap-2 rounded-full hover:bg-gray-50 px-3 py-1.5 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-[#2F6B6B] flex items-center justify-center text-white text-sm font-medium">
                    {session.name ? session.name[0].toUpperCase() : "U"}
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden sm:block">{session.name}</span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-lg py-2 z-50">
                    {session.type === "lojista" && session.storeId && (
                      <Link
                        to={`/dashboard/${session.storeId}`}
                        onClick={() => setDropdownOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Painel da Loja
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Sair da conta
                    </button>
                  </div>
                )}
              </div>
            </div>
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
          {session?.type === "client" && (
            <Link
              to="/cliente/agendamentos"
              className="text-sm font-medium text-[#2F6B6B]"
              onClick={() => setMobileOpen(false)}
            >
              Meus Agendamentos ({activeCount})
            </Link>
          )}
          {session && (
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                handleLogout();
              }}
              className="text-left text-sm font-medium text-red-600 pt-2 border-t border-gray-100"
            >
              Sair da conta
            </button>
          )}
        </div>
      )}
    </header>
  );
}
