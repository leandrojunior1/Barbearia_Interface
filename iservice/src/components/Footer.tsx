import { Link } from "react-router";

export default function Footer() {
  return (
    <footer id="contato" className="bg-gray-900 text-gray-300 pt-14 pb-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 pb-10 border-b border-gray-700">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: "#2F6B6B" }}>i</span>
              <span className="text-white font-semibold text-lg" style={{ fontFamily: "var(--font-display)" }}>iService</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
              Conectamos você aos melhores profissionais da sua cidade. Agende serviços de beleza, bem-estar e muito mais com facilidade.
            </p>
          </div>

          <div>
            <h4 className="text-white text-sm font-semibold mb-4">Contato</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/contato" className="hover:text-white transition-colors">Fale conosco</Link></li>
              <li><a href="mailto:contato@iservice.app" className="hover:text-white transition-colors">contato@iservice.app</a></li>
              <li><a href="tel:+5511999999999" className="hover:text-white transition-colors">(11) 99999-9999</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-sm font-semibold mb-4">Sobre nós</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">A empresa</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Carreiras</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacidade</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-sm font-semibold mb-4">Para lojistas</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/login?mode=lojista" className="hover:text-white transition-colors">Cadastrar loja</Link></li>
              <li><Link to="/login?mode=lojista" className="hover:text-white transition-colors">Painel do lojista</Link></li>
              <li><Link to="/suporte" className="hover:text-white transition-colors">Suporte</Link></li>
            </ul>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-8">
          © {new Date().getFullYear()} iService. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
