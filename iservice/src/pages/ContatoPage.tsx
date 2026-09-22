import Header from "../components/Header";
import Footer from "../components/Footer";

export default function ContatoPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 w-full">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <span className="inline-block text-xs font-semibold uppercase tracking-wide text-[#2F6B6B]">Contato</span>
          <h1 className="text-4xl font-bold text-gray-900 mt-3" style={{ fontFamily: "var(--font-display)" }}>Fale com a iService</h1>
          <div className="grid gap-4 mt-8">
            <div className="rounded-2xl border border-gray-100 p-4">
              <span className="text-xs font-medium text-gray-500">E-mail</span>
              <p className="mt-1 text-sm font-semibold text-gray-900">contato@iservice.app</p>
            </div>
            <div className="rounded-2xl border border-gray-100 p-4">
              <span className="text-xs font-medium text-gray-500">Telefone</span>
              <p className="mt-1 text-sm font-semibold text-gray-900">(11) 99999-9999</p>
            </div>
            <div className="rounded-2xl border border-gray-100 p-4">
              <span className="text-xs font-medium text-gray-500">Atendimento</span>
              <p className="mt-1 text-sm font-semibold text-gray-900">Segunda a sexta, 08h às 18h</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
