import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { storeRepo, bookingRepo, sessionRepo, type Store, type Service, type Professional, type Booking } from "../lib/db";

type Tab = "agendamentos" | "estabelecimento" | "servicos" | "profissionais" | "customizacao" | "financeiro" | "suporte";

const NAV_ITEMS: { key: Tab; label: string; icon: string }[] = [
  { key: "agendamentos", label: "Agendamentos", icon: "📅" },
  { key: "estabelecimento", label: "Estabelecimento", icon: "🏠" },
  { key: "servicos", label: "Serviços", icon: "✂️" },
  { key: "profissionais", label: "Profissionais", icon: "👤" },
  { key: "customizacao", label: "Customização", icon: "🎨" },
  { key: "financeiro", label: "Financeiro", icon: "💰" },
  { key: "suporte", label: "Suporte", icon: "🎧" },
];

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const STATUS_COLORS: Record<string, string> = { confirmado: "bg-green-50 text-green-700", cancelado: "bg-red-50 text-red-600" };

function todayISO() { return new Date().toISOString().slice(0, 10); }

function OverviewPanel({ store, bookings }: { store: Store; bookings: Booking[] }) {
  const today = todayISO();
  const todaysBookings = bookings.filter(b => b.date === today && b.status === "confirmado");
  return (
    <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-800 text-sm mb-3">Agendamentos de hoje</h3>
        {todaysBookings.length === 0 ? <p className="text-xs text-gray-400">Nenhum agendamento para hoje.</p> : (
          <div className="space-y-2">
            {todaysBookings.map(b => {
              const service = store.services.find(s => s.id === b.serviceId);
              const pro = store.professionals.find(p => p.id === b.professionalId);
              return (
                <div key={b.id} className="flex justify-between text-sm border-b border-gray-50 pb-1.5 last:border-0">
                  <span className="text-gray-700">{b.time} — {b.clientName}</span>
                  <span className="text-gray-400 text-xs">{service?.name} · {pro?.name}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-800 text-sm mb-3">Horário dos funcionários</h3>
        {store.professionals.length === 0 ? <p className="text-xs text-gray-400">Nenhum profissional cadastrado ainda.</p> : (
          <div className="space-y-2">
            {store.professionals.map(p => (
              <div key={p.id} className="flex justify-between text-sm border-b border-gray-50 pb-1.5 last:border-0">
                <span className="text-gray-700">{p.name}</span>
                <span className="text-gray-400 text-xs">{p.workStart}–{p.workEnd} (pausa {p.breakStart}–{p.breakEnd})</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AgendamentosTab({ store, bookings, onCancel }: { store: Store; bookings: Booking[]; onCancel: (id: string) => void }) {
  const [filter, setFilter] = useState<string | null>(null);
  const filtered = filter ? bookings.filter(b => b.professionalId === filter) : bookings;
  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>Agendamentos</h2>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilter(null)} className={`text-xs px-3 py-1.5 rounded-full transition-colors ${!filter ? "bg-[#2F6B6B] text-white" : "bg-gray-100 text-gray-600"}`}>Todos</button>
          {store.professionals.map(p => (
            <button key={p.id} onClick={() => setFilter(p.id)} className={`text-xs px-3 py-1.5 rounded-full transition-colors ${filter === p.id ? "bg-[#2F6B6B] text-white" : "bg-gray-100 text-gray-600"}`}>{p.name.split(" ")[0]}</button>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100 bg-gray-50">{["Data", "Horário", "Cliente", "Serviço", "Profissional", "Status", ""].map(h => <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>)}</tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={7} className="text-center text-gray-400 text-sm py-8">Nenhum agendamento ainda.</td></tr>}
            {filtered.map(b => {
              const service = store.services.find(s => s.id === b.serviceId);
              const pro = store.professionals.find(p => p.id === b.professionalId);
              return (
                <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-gray-600">{b.date}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{b.time}</td>
                  <td className="px-4 py-3 text-gray-700">{b.clientName}</td>
                  <td className="px-4 py-3 text-gray-600">{service?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{pro?.name ?? "—"}</td>
                  <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[b.status]}`}>{b.status}</span></td>
                  <td className="px-4 py-3">{b.status === "confirmado" && <button onClick={() => onCancel(b.id)} className="text-xs text-red-500 hover:underline">Cancelar</button>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EstabelecimentoTab({ store, onSave }: { store: Store; onSave: (patch: Partial<Store>) => void }) {
  const [workDays, setWorkDays] = useState(store.establishment.workDays);
  const [openTime, setOpenTime] = useState(store.establishment.openTime);
  const [closeTime, setCloseTime] = useState(store.establishment.closeTime);
  const [holidays, setHolidays] = useState(store.establishment.holidays);
  const [newHoliday, setNewHoliday] = useState("");

  function toggleDay(d: number) { setWorkDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort()); }
  function save() { onSave({ establishment: { workDays, openTime, closeTime, holidays } }); }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6" style={{ fontFamily: "var(--font-display)" }}>Estabelecimento</h2>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6 max-w-lg">
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-2">Dias de funcionamento</label>
          <div className="flex gap-2 flex-wrap">
            {WEEKDAYS.map((d, i) => (
              <button key={i} onClick={() => toggleDay(i)} className={`w-11 h-11 rounded-xl text-xs font-medium border transition-all ${workDays.includes(i) ? "bg-[#2F6B6B] text-white border-[#2F6B6B]" : "border-gray-200 text-gray-500"}`}>{d}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-xs font-medium text-gray-500 block mb-2">Abre</label><input type="time" value={openTime} onChange={e => setOpenTime(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" /></div>
          <div><label className="text-xs font-medium text-gray-500 block mb-2">Fecha</label><input type="time" value={closeTime} onChange={e => setCloseTime(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" /></div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-2">Feriados / dias fechados</label>
          <div className="flex gap-2 mb-2">
            <input type="date" value={newHoliday} onChange={e => setNewHoliday(e.target.value)} className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm" />
            <button onClick={() => { if (newHoliday) { setHolidays(p => [...p, newHoliday]); setNewHoliday(""); } }} className="px-3 py-2 rounded-xl text-white text-sm" style={{ background: "#2F6B6B" }}>Adicionar</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {holidays.map(h => <span key={h} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full flex items-center gap-1.5">{h} <button onClick={() => setHolidays(p => p.filter(x => x !== h))} className="text-gray-400 hover:text-red-500">×</button></span>)}
          </div>
        </div>
        <button onClick={save} className="w-full py-3 rounded-xl text-white text-sm font-semibold" style={{ background: "#2F6B6B" }}>Salvar</button>
      </div>
    </div>
  );
}

function ServicosTab({ store, onSave }: { store: Store; onSave: (patch: Partial<Store>) => void }) {
  const [services, setServices] = useState<Service[]>(store.services);
  const [form, setForm] = useState({ name: "", duration: "", price: "" });

  function add() {
    if (!form.name || !form.duration || !form.price) return;
    const next = [...services, { id: crypto.randomUUID(), name: form.name, duration: Number(form.duration), price: Number(form.price) }];
    setServices(next); onSave({ services: next }); setForm({ name: "", duration: "", price: "" });
  }
  function remove(id: string) { const next = services.filter(s => s.id !== id); setServices(next); onSave({ services: next }); }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6" style={{ fontFamily: "var(--font-display)" }}>Serviços</h2>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4 max-w-lg">
        <h3 className="font-semibold text-gray-800 text-sm mb-3">Novo serviço</h3>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <input placeholder="Nome" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="col-span-3 sm:col-span-1 border border-gray-200 rounded-xl px-3 py-2 text-sm" />
          <input placeholder="Duração (min)" inputMode="numeric" value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value.replace(/\D/g, "") }))} className="border border-gray-200 rounded-xl px-3 py-2 text-sm" />
          <input placeholder="Preço (R$)" inputMode="decimal" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value.replace(/[^0-9.]/g, "") }))} className="border border-gray-200 rounded-xl px-3 py-2 text-sm" />
        </div>
        <button onClick={add} className="px-4 py-2 rounded-xl text-white text-sm font-medium" style={{ background: "#2F6B6B" }}>Adicionar serviço</button>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 max-w-lg">
        {services.length === 0 && <p className="p-6 text-sm text-gray-400 text-center">Nenhum serviço cadastrado ainda.</p>}
        {services.map(s => (
          <div key={s.id} className="flex items-center justify-between px-5 py-3">
            <div><p className="text-sm font-medium text-gray-800">{s.name}</p><p className="text-xs text-gray-400">{s.duration} min · R$ {s.price.toFixed(2)}</p></div>
            <button onClick={() => remove(s.id)} className="text-xs text-red-500 hover:underline">Remover</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfissionaisTab({ store, onSave }: { store: Store; onSave: (patch: Partial<Store>) => void }) {
  const [pros, setPros] = useState<Professional[]>(store.professionals);
  const [form, setForm] = useState({ name: "", role: "", photo: "", serviceIds: [] as string[] });

  function toggleService(id: string) { setForm(p => ({ ...p, serviceIds: p.serviceIds.includes(id) ? p.serviceIds.filter(x => x !== id) : [...p.serviceIds, id] })); }
  function add() {
    if (!form.name) return;
    const next = [...pros, {
      id: crypto.randomUUID(), name: form.name, role: form.role,
      photo: form.photo || "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&auto=format",
      serviceIds: form.serviceIds, workDays: [1, 2, 3, 4, 5, 6], workStart: "09:00", workEnd: "18:00", breakStart: "12:00", breakEnd: "13:00",
    }];
    setPros(next); onSave({ professionals: next }); setForm({ name: "", role: "", photo: "", serviceIds: [] });
  }
  function remove(id: string) { const next = pros.filter(p => p.id !== id); setPros(next); onSave({ professionals: next }); }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6" style={{ fontFamily: "var(--font-display)" }}>Profissionais</h2>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4 max-w-lg">
        <h3 className="font-semibold text-gray-800 text-sm mb-3">Novo profissional</h3>
        <div className="space-y-2 mb-3">
          <input placeholder="Nome" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
          <input placeholder="Descrição (ex: Especialista em coloração)" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
          <input placeholder="URL da foto (opcional)" value={form.photo} onChange={e => setForm(p => ({ ...p, photo: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
        </div>
        {store.services.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-500 mb-1.5">Serviços que este profissional realiza</p>
            <div className="flex flex-wrap gap-2">
              {store.services.map(s => (
                <button key={s.id} type="button" onClick={() => toggleService(s.id)} className={`text-xs px-3 py-1.5 rounded-full border transition-all ${form.serviceIds.includes(s.id) ? "bg-[#2F6B6B] text-white border-[#2F6B6B]" : "border-gray-200 text-gray-600"}`}>{s.name}</button>
              ))}
            </div>
          </div>
        )}
        <button onClick={add} className="px-4 py-2 rounded-xl text-white text-sm font-medium" style={{ background: "#2F6B6B" }}>Adicionar profissional</button>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 max-w-lg">
        {pros.length === 0 && <p className="p-6 text-sm text-gray-400 text-center">Nenhum profissional cadastrado ainda.</p>}
        {pros.map(p => (
          <div key={p.id} className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-3">
              <img src={p.photo} alt="" className="w-9 h-9 rounded-full object-cover" />
              <div><p className="text-sm font-medium text-gray-800">{p.name}</p><p className="text-xs text-gray-400">{p.role} · {p.serviceIds.length} serviço(s)</p></div>
            </div>
            <button onClick={() => remove(p.id)} className="text-xs text-red-500 hover:underline">Remover</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function FinanceiroTab({ store, bookings, onSave }: { store: Store; bookings: Booking[]; onSave: (patch: Partial<Store>) => void }) {
  const confirmed = bookings.filter(b => b.status === "confirmado");
  const now = new Date();
  const msWeek = 7 * 24 * 60 * 60 * 1000;
  const thisWeek = confirmed.filter(b => now.getTime() - new Date(b.date).getTime() < msWeek);
  const lastWeek = confirmed.filter(b => { const diff = now.getTime() - new Date(b.date).getTime(); return diff >= msWeek && diff < msWeek * 2; });
  const totalThis = thisWeek.reduce((s, b) => s + b.price, 0);
  const totalLast = lastWeek.reduce((s, b) => s + b.price, 0);
  const change = totalLast > 0 ? Math.round(((totalThis - totalLast) / totalLast) * 100) : totalThis > 0 ? 100 : 0;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6" style={{ fontFamily: "var(--font-display)" }}>Financeiro</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <p className="text-xs font-medium text-gray-500 mb-2">Faturamento (últimos 7 dias)</p>
          <p className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "var(--font-display)" }}>R$ {totalThis.toFixed(2)}</p>
          <p className={`text-xs font-medium ${change >= 0 ? "text-green-600" : "text-red-500"}`}>{change >= 0 ? "+" : ""}{change}% vs semana passada</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <p className="text-xs font-medium text-gray-500 mb-2">Agendamentos confirmados</p>
          <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>{confirmed.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <p className="text-xs font-medium text-gray-500 mb-2">Dia de fechamento semanal</p>
          <select value={store.financeClosingDay} onChange={e => onSave({ financeClosingDay: Number(e.target.value) })} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white">
            {WEEKDAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
          </select>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Últimas movimentações</h3>
        {confirmed.length === 0 ? <p className="text-sm text-gray-400">Nenhum agendamento confirmado ainda.</p> : (
          <div className="space-y-3">
            {confirmed.slice(-8).reverse().map(b => {
              const service = store.services.find(s => s.id === b.serviceId);
              return (
                <div key={b.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div><p className="text-sm text-gray-700">{service?.name} — {b.clientName}</p><p className="text-xs text-gray-400">{b.date}</p></div>
                  <p className="text-sm font-semibold text-green-600">+ R$ {b.price.toFixed(2)}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function CustomizacaoTab({ store, onSave }: { store: Store; onSave: (patch: Partial<Store>) => void }) {
  const [c, setC] = useState(store.customization);
  const borderRadius = c.cardStyle === "quadrado" ? "12px" : c.cardStyle === "circular" ? "50%" : "50% 50% 0 0";
  const bg = c.cardFill === "gradient" ? `linear-gradient(135deg, ${c.primaryColor}, ${c.secondaryColor})` : c.primaryColor;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6" style={{ fontFamily: "var(--font-display)" }}>Customização da Loja</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Tipografia</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-2">Família de fonte</label>
                <select value={c.fontFamily} onChange={e => setC(p => ({ ...p, fontFamily: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white">
                  {["Work Sans", "Playfair Display", "Inter", "Lora", "Poppins"].map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-2">Tamanho</label>
                <div className="flex gap-2">
                  {(["sm", "base", "lg"] as const).map(s => (
                    <button key={s} onClick={() => setC(p => ({ ...p, fontSize: s }))} className={`px-4 py-2 rounded-xl text-sm border transition-all ${c.fontSize === s ? "bg-[#2F6B6B] text-white border-[#2F6B6B]" : "border-gray-200 text-gray-600"}`}>
                      {s === "sm" ? "Pequeno" : s === "base" ? "Médio" : "Grande"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Cores</h3>
            <div className="space-y-4">
              <div><label className="text-xs font-medium text-gray-500 block mb-2">Cor primária</label><div className="flex items-center gap-3"><input type="color" value={c.primaryColor} onChange={e => setC(p => ({ ...p, primaryColor: e.target.value }))} className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer" /><span className="text-sm font-mono text-gray-600">{c.primaryColor}</span></div></div>
              <div><label className="text-xs font-medium text-gray-500 block mb-2">Cor secundária</label><div className="flex items-center gap-3"><input type="color" value={c.secondaryColor} onChange={e => setC(p => ({ ...p, secondaryColor: e.target.value }))} className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer" /><span className="text-sm font-mono text-gray-600">{c.secondaryColor}</span></div></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Formato dos cards</h3>
            <div className="flex gap-2 mb-4">
              {(["quadrado", "circular", "semicirculo"] as const).map(s => (
                <button key={s} onClick={() => setC(p => ({ ...p, cardStyle: s }))} className={`px-3 py-2 rounded-xl text-xs border transition-all capitalize ${c.cardStyle === s ? "bg-[#2F6B6B] text-white border-[#2F6B6B]" : "border-gray-200 text-gray-600"}`}>
                  {s === "semicirculo" ? "Semicírculo" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {(["solido", "gradient"] as const).map(s => (
                <button key={s} onClick={() => setC(p => ({ ...p, cardFill: s }))} className={`px-3 py-2 rounded-xl text-xs border transition-all ${c.cardFill === s ? "bg-[#2F6B6B] text-white border-[#2F6B6B]" : "border-gray-200 text-gray-600"}`}>
                  {s === "gradient" ? "Gradiente" : "Sólido"}
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => onSave({ customization: c })} className="w-full py-3 rounded-xl text-white text-sm font-semibold" style={{ background: "#2F6B6B" }}>Salvar customização</button>
        </div>
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-6 flex flex-col items-center justify-center gap-6 h-fit">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Prévia (aplicada na sua página real)</p>
          <div className="bg-white rounded-2xl shadow-sm p-6 w-full max-w-xs">
            <div className="w-20 h-20 mx-auto mb-4" style={{ background: bg, borderRadius }}><div className="w-full h-full flex items-center justify-center text-white text-2xl">✂️</div></div>
            <h3 className="text-center font-bold mb-1" style={{ fontFamily: c.fontFamily, fontSize: c.fontSize === "sm" ? "14px" : c.fontSize === "lg" ? "20px" : "16px", color: c.primaryColor }}>{store.name}</h3>
            <p className="text-center text-xs text-gray-400" style={{ fontFamily: c.fontFamily }}>{store.category}</p>
            <button className="mt-4 w-full py-2.5 rounded-xl text-white text-sm font-medium" style={{ background: bg, borderRadius: "12px" }}>Agendar agora</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("agendamentos");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [store, setStore] = useState<Store | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);

  function refresh() {
    if (!storeId) return;
    setStore(storeRepo.getById(storeId) ?? null);
    setBookings(bookingRepo.getByStore(storeId));
  }

  useEffect(() => { refresh(); }, [storeId]);

  function patch(p: Partial<Store>) { if (!storeId) return; storeRepo.update(storeId, p); refresh(); }
  function cancelBooking(id: string) { bookingRepo.cancel(id); refresh(); }
  function logout() { sessionRepo.clear(); navigate("/"); }

  if (!store) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Loja não encontrada. <Link to="/login" className="text-[#2F6B6B] ml-1">Fazer login</Link></div>;
  }

  const content = {
    agendamentos: <AgendamentosTab store={store} bookings={bookings} onCancel={cancelBooking} />,
    estabelecimento: <EstabelecimentoTab store={store} onSave={patch} />,
    servicos: <ServicosTab store={store} onSave={patch} />,
    profissionais: <ProfissionaisTab store={store} onSave={patch} />,
    customizacao: <CustomizacaoTab store={store} onSave={patch} />,
    financeiro: <FinanceiroTab store={store} bookings={bookings} onSave={patch} />,
    suporte: <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">Em breve.</div>,
  }[tab];

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className={`fixed inset-y-0 left-0 z-40 w-60 bg-white border-r border-gray-100 flex flex-col transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:static lg:translate-x-0`}>
        <div className="p-5 border-b border-gray-100 flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ background: "#2F6B6B" }}>i</span>
          <span className="font-semibold text-gray-900 text-sm" style={{ fontFamily: "var(--font-display)" }}>iService</span>
          <span className="ml-auto text-xs text-gray-400 font-medium">Lojista</span>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <button key={item.key} onClick={() => { setTab(item.key); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors ${tab === item.key ? "bg-[#EBF3F3] text-[#2F6B6B]" : "text-gray-600 hover:bg-gray-50"}`}>
              <span>{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#2F6B6B] flex items-center justify-center text-white text-xs font-medium">{store.name[0]}</div>
            <div className="min-w-0"><p className="text-sm font-medium text-gray-800 truncate">{store.username}</p><p className="text-xs text-gray-400">{store.name}</p></div>
          </div>
          <button onClick={logout} className="mt-3 w-full flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors py-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Sair
          </button>
        </div>
      </aside>
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <div className="flex-1 min-w-0">
        <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center gap-4 sticky top-0 z-20">
          <button className="lg:hidden p-1.5 text-gray-600" onClick={() => setSidebarOpen(true)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <h1 className="text-sm font-semibold text-gray-700">Painel do Lojista — {store.name}</h1>
        </header>
        <main className="p-6 max-w-5xl mx-auto">
          <OverviewPanel store={store} bookings={bookings} />
          {content}
        </main>
      </div>
    </div>
  );
}
