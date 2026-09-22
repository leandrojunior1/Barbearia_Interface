import { Link, useNavigate } from "react-router";
import { categoriesRepo } from "../lib/db";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function CategoriasPage() {
  const navigate = useNavigate();
  const categories = categoriesRepo.getAll();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <span className="inline-block text-xs font-semibold uppercase tracking-wide text-[#2F6B6B]">Categorias</span>
            <h1 className="text-4xl font-bold text-gray-900 mt-3" style={{ fontFamily: "var(--font-display)" }}>Explore por serviço</h1>
            <p className="text-gray-500 text-sm mt-3">Escolha uma categoria para encontrar estabelecimentos próximos de você.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(category => (
              <button
                key={category.slug}
                type="button"
                onClick={() => navigate(`/?categoria=${encodeURIComponent(category.name)}`)}
                className="group text-left bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-5"
              >
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-2xl bg-[#EBF3F3] flex items-center justify-center text-xl shadow-sm">{category.emoji}</span>
                  <div>
                    <span className="font-semibold text-gray-900 text-sm">{category.name}</span>
                    <div className="text-xs text-gray-500 mt-1">Encontrar serviços</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-8">
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-[#2F6B6B] hover:underline">
              <span>←</span>
              Voltar para a página inicial
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
