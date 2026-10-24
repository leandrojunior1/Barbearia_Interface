import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import ToastContainer, { type ToastMessage } from "../components/Toast";
import {
  adminRepo,
  adminTicketRepo,
  storeRepo,
  categoriesRepo,
  ticketRepo,
  storeSupportTicketRepo,
  sessionRepo,
  type Store,
  type Ticket,
  type StoreSupportTicket,
} from "../lib/db";

type Tab = "metricas" | "aprovacoes" | "lojas" | "destaques" | "categorias" | "suporte";
type Plan = NonNullable<Store["plano"]>;

function seedTicketsIfEmpty() {
  if (ticketRepo.getAll().length > 0) return;
  ticketRepo.save({ id: "T001", from: "João Silva", subject: "Problema no pagamento", status: "aberto", messages: [{ sender: "João Silva", text: "Meu recebimento da semana passada não caiu na conta.", time: "08:30" }] });
  ticketRepo.save({ id: "T002", from: "Fernanda Alves", subject: "Solicitação de personalização", status: "aberto", messages: [{ sender: "Fernanda Alves", text: "Quero alterar o layout da minha página. Como faço?", time: "14:00" }] });
}
function daysSince(iso?: string) { if (!iso) return 0; return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24)); }

export default function AdminPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("aprovacoes");
  const [stores, setStores] = useState<Store[]>([]);
  const [cats, setCats] = useState<{ name: string; emoji: string; slug: string }[]>([]);
  const [newCat, setNewCat] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [storeTickets, setStoreTickets] = useState<StoreSupportTicket[]>([]);
  const [metrics, setMetrics] = useState(() => adminRepo.getGlobalMetrics());
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");
  const [storeTicketReplies, setStoreTicketReplies] = useState<Record<string, string>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  function addToast(text: string, type: ToastMessage["type"] = "success") {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, text, type }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4000);
  }

  function refresh() {
    setStores(storeRepo.getAll());
    setCats(categoriesRepo.getAll());
    setTickets(ticketRepo.getAll());
    setStoreTickets(storeSupportTicketRepo.getAll());
    setMetrics(adminRepo.getGlobalMetrics());
  }
  useEffect(() => { seedTicketsIfEmpty(); refresh(); }, []);

  const pending = stores.filter(s => s.status === "pendente");
  const activeAndSuspended = stores.filter(s => s.status !== "pendente");

  function approve(id: string) { storeRepo.update(id, { status: "ativo" }); refresh(); }
  function reject(id: string) { storeRepo.remove(id); refresh(); }
  function toggleSuspend(s: Store) { storeRepo.update(s.id, { status: s.status === "suspenso" ? "ativo" : "suspenso" }); refresh(); }
  function deactivate(s: Store) { storeRepo.update(s.id, { status: "desativado", deactivatedAt: new Date().toISOString() }); refresh(); }
  function toggleFeatured(s: Store) { storeRepo.update(s.id, { featured: !s.featured }); refresh(); }
  function toggleAvailability(s: Store) {
    adminRepo.toggleStoreStatus(s.id);
    refresh();
    addToast("Disponibilidade da loja atualizada.");
  }
  function updatePlan(storeId: string, plan: Plan) {
    adminRepo.updateStorePlan(storeId, plan);
    refresh();
    addToast(`Plano atualizado para ${plan}.`);
  }
  function replyToStoreTicket(ticket: StoreSupportTicket) {
    const ticketReply = storeTicketReplies[ticket.id]?.trim();
    if (!ticketReply) return;
    adminTicketRepo.replyTicket(ticket.id, ticketReply);
    setStoreTicketReplies((current) => ({ ...current, [ticket.id]: "" }));
    refresh();
    addToast("Resposta enviada ao lojista.");
  }
  function addCategory() { if (!newCat.trim()) return; categoriesRepo.add(newCat.trim()); setNewCat(""); refresh(); }
  function removeCategory(name: string) { categoriesRepo.remove(name); refresh(); }
  function sendReply() {
    if (!selectedTicket || !reply.trim()) return;
    ticketRepo.reply(selectedTicket.id, "Suporte", reply.trim());
    setReply(""); refresh();
    setSelectedTicket(ticketRepo.getAll().find(t => t.id === selectedTicket.id) ?? null);
  }

  const NAV: { key: Tab; label: string; icon: string }[] = [
    { key: "metricas", label: "Métricas da plataforma", icon: "📊" },
    { key: "aprovacoes", label: "Aprovações pendentes", icon: "⏳" },
    { key: "lojas", label: "Gestão de lojas", icon: "🏪" },
    { key: "destaques", label: "Destaques", icon: "⭐" },
    { key: "categorias", label: "Categorias", icon: "🏷️" },
    { key: "suporte", label: "Suporte (tickets)", icon: "🎧" },
  ];

  function MetricasTab() {
    const cards = [
      { label: "Estabelecimentos", value: metrics.totalStores, detail: `${metrics.activeStores} ativos`, color: "text-gray-900" },
      { label: "Agendamentos", value: metrics.totalBookings, detail: "Total registrado", color: "text-gray-900" },
      { label: "Faturamento bruto", value: `R$ ${metrics.totalRevenue.toFixed(2)}`, detail: "Agendamentos confirmados", color: "text-[#2F6B6B]" },
      { label: "Chamados em aberto", value: metrics.openTickets, detail: "Aguardando atendimento", color: "text-amber-600" },
    ];

    return (
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-6" style={{ fontFamily: "var(--font-display)" }}>
          Métricas da plataforma
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {cards.map(card => (
            <div key={card.label} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{card.label}</p>
              <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
              <p className="text-xs text-gray-500 mt-2">{card.detail}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

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
            <thead><tr className="border-b border-gray-100 bg-gray-50">{["ID", "Nome", "Categoria", "Status", "Plano", "Disponibilidade", "Ações"].map(h => <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>)}</tr></thead>
            <tbody>
              {activeAndSuspended.length === 0 && <tr><td colSpan={7} className="text-center text-gray-400 text-sm py-8">Nenhuma loja ativa ainda.</td></tr>}
              {activeAndSuspended.map(s => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-400 font-mono">{s.loginId}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{s.name}</td>
                  <td className="px-4 py-3 text-gray-600">{s.category}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${s.status === "ativo" ? "bg-green-50 text-green-700" : s.status === "suspenso" ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-600"}`}>{s.status}</span>
                    {s.status === "desativado" && <p className="text-[10px] text-gray-400 mt-1">Exclusão elegível em {180 - daysSince(s.deactivatedAt)} dias</p>}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      aria-label={`Plano de ${s.name}`}
                      value={s.plano ?? "Pro"}
                      onChange={event => updatePlan(s.id, event.target.value as Plan)}
                      className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white font-medium focus:outline-none focus:border-[#2F6B6B]"
                    >
                      <option value="Grátis">Grátis</option>
                      <option value="Pro">Pro</option>
                      <option value="Enterprise">Enterprise</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${s.availabilityStatus === "Inativo" ? "bg-gray-100 text-gray-600" : "bg-emerald-50 text-emerald-700"}`}>
                      {s.availabilityStatus ?? "Ativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2 flex-wrap">
                    <button
                      onClick={() => navigate(`/dashboard/${s.id}`)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-[#2F6B6B]/20 text-[#2F6B6B] hover:bg-[#EBF3F3]"
                    >
                      Ver Painel
                    </button>
                    {s.status !== "desativado" && (
                      <button
                        onClick={() => toggleAvailability(s)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${s.availabilityStatus === "Inativo" ? "border-green-200 text-green-600 hover:bg-green-50" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                      >
                        {s.availabilityStatus === "Inativo" ? "Ativar" : "Desativar"}
                      </button>
                    )}
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
        <section className="mt-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Chamados enviados pelos lojistas</h3>
          {storeTickets.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-400">
              Nenhum chamado de lojista registrado.
            </div>
          ) : (
            <div className="space-y-3">
              {storeTickets.map(ticket => {
                const store = storeRepo.getById(ticket.storeId);
                return (
                  <article key={ticket.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ticket.status === "Em Aberto" ? "bg-yellow-50 text-yellow-700" : "bg-blue-50 text-blue-700"}`}>
                          {ticket.status}
                        </span>
                        <span className="text-xs text-gray-500">{store?.name ?? ticket.storeId}</span>
                        <span className="text-xs text-gray-400">{ticket.category} · {new Date(ticket.createdAt).toLocaleDateString("pt-BR")}</span>
                      </div>
                      <h4 className="font-semibold text-gray-800 text-sm">{ticket.subject}</h4>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{ticket.message}</p>
                      {ticket.adminReply && (
                        <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                          <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-blue-800">
                            Resposta enviada
                          </p>
                          <p className="whitespace-pre-wrap text-xs text-blue-900">{ticket.adminReply}</p>
                        </div>
                      )}
                    </div>
                    {ticket.status === "Em Aberto" && (
                      <div className="w-full shrink-0 space-y-2 sm:w-64">
                        <label className="sr-only" htmlFor={`reply-${ticket.id}`}>Resposta ao chamado</label>
                        <textarea
                          id={`reply-${ticket.id}`}
                          rows={3}
                          value={storeTicketReplies[ticket.id] ?? ""}
                          onChange={(event) => setStoreTicketReplies((current) => ({
                            ...current,
                            [ticket.id]: event.target.value,
                          }))}
                          placeholder="Escreva uma resposta para o lojista"
                          className="w-full rounded-xl border border-gray-200 p-3 text-xs focus:border-[#2F6B6B] focus:outline-none"
                        />
                        <button
                          type="button"
                          disabled={!storeTicketReplies[ticket.id]?.trim()}
                          onClick={() => replyToStoreTicket(ticket)}
                          className="w-full rounded-xl bg-[#2F6B6B] px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Enviar resposta
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    );
  }

  const renderTab = {
    metricas: MetricasTab,
    aprovacoes: AprovTab,
    lojas: LojasTab,
    destaques: DestaquesTab,
    categorias: CatsTab,
    suporte: SuporteTab,
  }[tab];
  const content = renderTab();

  return (
    <div className="min-h-screen flex bg-gray-50">
      <ToastContainer
        toasts={toasts}
        onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))}
      />
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
          <button
            type="button"
            onClick={() => { sessionRepo.clear(); navigate("/"); }}
            className="flex items-center gap-2 text-xs text-white/40 hover:text-white/60 transition-colors py-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Sair
          </button>
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
            <div className="flex items-center gap-1.5 text-xs text-yellow-600 bg-yellow-50 px-3 py-1.5 rounded-full font-medium"><span>⏳</span> {pending.length} aprovações · {metrics.openTickets} chamados</div>
          </div>
        </header>
        <main className="p-6 max-w-5xl mx-auto">{content}</main>
      </div>
    </div>
  );
}
