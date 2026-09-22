import { useEffect, useState } from "react";
import { Link } from "react-router";
import { storeRepo, categoriesRepo, ticketRepo, type Store, type Ticket } from "../lib/db";

type Tab = "aprovacoes" | "lojas" | "destaques" | "categorias" | "suporte";

function seedTicketsIfEmpty() {
  if (ticketRepo.getAll().length > 0) return;
  ticketRepo.save({ id: "T001", from: "João Silva", subject: "Problema no pagamento", status: "aberto", messages: [{ sender: "João Silva", text: "Meu recebimento da semana passada não caiu na conta.", time: "08:30" }] });
  ticketRepo.save({ id: "T002", from: "Fernanda Alves", subject: "Solicitação de personalização", status: "aberto", messages: [{ sender: "Fernanda Alves", text: "Quero alterar o layout da minha página. Como faço?", time: "14:00" }] });
}
function daysSince(iso?: string) { if (!iso) return 0; return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24)); }

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("aprovacoes");
  const [stores, setStores] = useState<Store[]>([]);
  const [cats, setCats] = useState<{ name: string; emoji: string; slug: string }[]>([]);
  const [newCat, setNewCat] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function refresh() { setStores(storeRepo.getAll()); setCats(categoriesRepo.getAll()); setTickets(ticketRepo.getAll()); }
  useEffect(() => { seedTicketsIfEmpty(); refresh(); }, []);

  const pending = stores.filter(s => s.status === "pendente");
  const activeAndSuspended = stores.filter(s => s.status !== "pendente");

  function approve(id: string) { storeRepo.update(id, { status: "ativo" }); refresh(); }
  function reject(id: string) { storeRepo.remove(id); refresh(); }
  function toggleSuspend(s: Store) { storeRepo.update(s.id, { status: s.status === "suspenso" ? "ativo" : "suspenso" }); refresh(); }
  function deactivate(s: Store) { storeRepo.update(s.id, { status: "desativado", deactivatedAt: new Date().toISOString() }); refresh(); }
  function toggleFeatured(s: Store) { storeRepo.update(s.id, { featured: !s.featured }); refresh(); }
  function addCategory() { if (!newCat.trim()) return; categoriesRepo.add(newCat.trim()); setNewCat(""); refresh(); }
  function removeCategory(name: string) { categoriesRepo.remove(name); refresh(); }
  function sendReply() {
    if (!selectedTicket || !reply.trim()) return;
    ticketRepo.reply(selectedTicket.id, "Suporte", reply.trim());
    setReply(""); refresh();
    setSelectedTicket(ticketRepo.getAll().find(t => t.id === selectedTicket.id) ?? null);
  }

  const NAV: { key: Tab; label: string; icon: string }[] = [
    { key: "aprovacoes", label: "Aprovações pendentes", icon: "⏳" },
    { key: "lojas", label: "Gestão de lojas", icon: "🏪" },
    { key: "destaques", label: "Destaques", icon: "⭐" },
    { key: "categorias", label: "Categorias", icon: "🏷️" },
    { key: "suporte", label: "Suporte (tickets)", icon: "🎧" },
  ];

  function AprovTab() {
    return (
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-6" style={{ fontFamily: "var(--font-display)" }}>Aprovações pendentes</h2>
        {pending.length === 0 ? <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400 text-sm">Nenhum cadastro aguardando aprovação.</div> : (
          <div className="space-y-3">
            {pending.map(p => (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1"><span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full font-medium">Pendente</span><span className="text-xs text-gray-400 font-mono">ID {p.loginId}</span></div>
                  <p className="font-semibold text-gray-800">{p.name}</p>
                  <p className="text-sm text-gray-500">{p.category} · {p.username} · {p.phone}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Contato preferido: {p.preferredContact}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => reject(p.id)} className="px-4 py-2 rounded-xl text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors">Rejeitar</button>
                  <button onClick={() => approve(p.id)} className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors" style={{ background: "#2F6B6B" }}>Aprovar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function LojasTab() {
    return (
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-6" style={{ fontFamily: "var(--font-display)" }}>Gestão de lojas</h2>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 bg-gray-50">{["ID", "Nome", "Categoria", "Status", "Ações"].map(h => <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>)}</tr></thead>
            <tbody>
              {activeAndSuspended.length === 0 && <tr><td colSpan={5} className="text-center text-gray-400 text-sm py-8">Nenhuma loja ativa ainda.</td></tr>}
              {activeAndSuspended.map(s => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-400 font-mono">{s.loginId}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{s.name}</td>
                  <td className="px-4 py-3 text-gray-600">{s.category}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${s.status === "ativo" ? "bg-green-50 text-green-700" : s.status === "suspenso" ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-600"}`}>{s.status}</span>
                    {s.status === "desativado" && <p className="text-[10px] text-gray-400 mt-1">Exclusão elegível em {180 - daysSince(s.deactivatedAt)} dias</p>}
                  </td>
                  <td className="px-4 py-3 flex gap-2 flex-wrap">
                    {s.status !== "desativado" && <button onClick={() => toggleSuspend(s)} className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${s.status === "ativo" ? "border-red-200 text-red-600 hover:bg-red-50" : "border-green-200 text-green-600 hover:bg-green-50"}`}>{s.status === "ativo" ? "Suspender" : "Reativar"}</button>}
                    {s.status !== "desativado" && <button onClick={() => deactivate(s)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">Desativar</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function DestaquesTab() {
    const activos = stores.filter(s => s.status === "ativo");
    return (
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: "var(--font-display)" }}>Destaques</h2>
        <p className="text-sm text-gray-500 mb-6">Escolha manualmente quais lojas pagantes aparecem no carrossel "Destaques" da Home.</p>
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
          {activos.length === 0 && <p className="p-6 text-sm text-gray-400 text-center">Nenhuma loja ativa ainda.</p>}
          {activos.map(s => (
            <div key={s.id} className="flex items-center justify-between px-5 py-3">
              <div><p className="text-sm font-medium text-gray-800">{s.name}</p><p className="text-xs text-gray-400">{s.category}</p></div>
              <button onClick={() => toggleFeatured(s)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${s.featured ? "bg-[#2F6B6B] text-white border-[#2F6B6B]" : "border-gray-200 text-gray-600"}`}>{s.featured ? "⭐ Em destaque" : "Destacar"}</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function CatsTab() {
    return (
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-6" style={{ fontFamily: "var(--font-display)" }}>Categorias</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-700 mb-4 text-sm">Categorias existentes ({cats.length})</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {cats.map(c => (
                <div key={c.name} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-gray-50 group">
                  <span className="text-sm text-gray-700">{c.emoji} {c.name}</span>
                  <button onClick={() => removeCategory(c.name)} className="opacity-0 group-hover:opacity-100 text-xs text-red-400 hover:text-red-600 transition-all">Remover</button>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 h-fit">
            <h3 className="font-semibold text-gray-700 mb-4 text-sm">Adicionar categoria</h3>
            <div className="flex gap-2">
              <input value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="Nome da nova categoria" className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#2F6B6B]" />
              <button onClick={addCategory} className="px-4 py-2.5 rounded-xl text-white text-sm font-medium shrink-0" style={{ background: "#2F6B6B" }}>Adicionar</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function SuporteTab() {
    return (
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-6" style={{ fontFamily: "var(--font-display)" }}>Suporte — Tickets</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            {tickets.map(t => (
              <button key={t.id} onClick={() => setSelectedTicket(t)} className={`w-full text-left bg-white rounded-2xl border p-4 transition-all ${selectedTicket?.id === t.id ? "border-[#2F6B6B] shadow-sm" : "border-gray-100 hover:border-gray-200"}`}>
                <div className="flex items-center justify-between mb-1"><span className="text-xs font-mono text-gray-400">{t.id}</span><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.status === "aberto" ? "bg-yellow-50 text-yellow-700" : "bg-gray-100 text-gray-500"}`}>{t.status}</span></div>
                <p className="font-medium text-gray-800 text-sm">{t.subject}</p><p className="text-xs text-gray-400 mt-0.5">{t.from}</p>
              </button>
            ))}
          </div>
          {selectedTicket ? (
            <div className="bg-white rounded-2xl border border-gray-100 flex flex-col">
              <div className="p-4 border-b border-gray-100"><p className="font-semibold text-gray-800 text-sm">{selectedTicket.subject}</p><p className="text-xs text-gray-400">{selectedTicket.from}</p></div>
              <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-72">
                {selectedTicket.messages.map((m, i) => (
                  <div key={i} className={`flex flex-col ${m.sender === "Suporte" ? "items-end" : "items-start"}`}>
                    <span className="text-xs text-gray-400 mb-1">{m.sender} · {m.time}</span>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm max-w-[80%] ${m.sender === "Suporte" ? "bg-[#2F6B6B] text-white" : "bg-gray-100 text-gray-800"}`}>{m.text}</div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-100 flex gap-2">
                <input value={reply} onChange={e => setReply(e.target.value)} placeholder="Responder…" onKeyDown={e => e.key === "Enter" && sendReply()} className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#2F6B6B]" />
                <button onClick={sendReply} className="px-4 py-2 rounded-xl text-white text-sm" style={{ background: "#2F6B6B" }}>Enviar</button>
              </div>
            </div>
          ) : <div className="bg-white rounded-2xl border border-gray-100 flex items-center justify-center p-10 text-gray-400 text-sm">Selecione um ticket para ver a conversa</div>}
        </div>
      </div>
    );
  }

  const content = { aprovacoes: <AprovTab />, lojas: <LojasTab />, destaques: <DestaquesTab />, categorias: <CatsTab />, suporte: <SuporteTab /> }[tab];

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className={`fixed inset-y-0 left-0 z-40 w-60 bg-[#1a2e2e] flex flex-col transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:static lg:translate-x-0`}>
        <div className="p-5 border-b border-white/10 flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs bg-[#2F6B6B]">i</span>
          <span className="font-semibold text-white text-sm" style={{ fontFamily: "var(--font-display)" }}>iService</span>
          <span className="ml-auto text-xs text-white/40 font-medium">Admin</span>
        </div>
        <nav className="flex-1 py-4">
          {NAV.map(item => (
            <button key={item.key} onClick={() => { setTab(item.key); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors ${tab === item.key ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/5"}`}>
              <span>{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <Link to="/" className="flex items-center gap-2 text-xs text-white/40 hover:text-white/60 transition-colors py-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Sair
          </Link>
        </div>
      </aside>
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <div className="flex-1 min-w-0">
        <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center gap-4 sticky top-0 z-20">
          <button className="lg:hidden p-1.5 text-gray-600" onClick={() => setSidebarOpen(true)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <h1 className="text-sm font-semibold text-gray-700">Painel Master</h1>
          <div className="ml-auto flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs text-yellow-600 bg-yellow-50 px-3 py-1.5 rounded-full font-medium"><span>⏳</span> {pending.length} aprovações pendentes</div>
          </div>
        </header>
        <main className="p-6 max-w-5xl mx-auto">{content}</main>
      </div>
    </div>
  );
}
