import Header from "../components/Header";
import Footer from "../components/Footer";

const FAQ = [
  { q: "Como faço para agendar um serviço?", a: "Escolha um estabelecimento no marketplace e siga o passo a passo de agendamento." },
  { q: "Como cadastro minha loja?", a: "Na tela de login, escolha \"Entrar como Lojista\" e depois \"Cadastre sua loja\"." },
  { q: "Como cancelo um agendamento?", a: "Entre em contato diretamente com o estabelecimento — o lojista remove o horário pelo painel dele." },
];

export default function SuportePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 py-16 w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-4" style={{ fontFamily: "var(--font-display)" }}>Suporte</h1>
        <p className="text-gray-500 mb-8">Perguntas frequentes.</p>
        <div className="space-y-3">
          {FAQ.map((f, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="font-semibold text-gray-800 text-sm mb-1">{f.q}</p>
              <p className="text-sm text-gray-500">{f.a}</p>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
