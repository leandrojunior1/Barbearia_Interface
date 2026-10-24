import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  storeRepo, bookingRepo, sessionRepo, buildWhatsAppLink,
  type Store, type Service, type Professional,
} from "../lib/db";

type Step = 1 | 2 | 3 | 4 | 5;

interface Selection {
  service: Service | null;
  professional: Professional | null;
  date: string | null;
  time: string | null;
}

const WEEKDAY_LABEL = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTH_LABEL = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function toISODate(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function nextDays(n: number) {
  const out: Date[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    out.push(d);
  }
  return out;
}

function formatPhone(value: string) {
  const numbers = value.replace(/\D/g, "").slice(0, 11);
  if (numbers.length <= 2) return `(${numbers}`;
  if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
}

function generateTimesForDay(store: Store, pro: Professional, date: string, durationMin: number): string[] {
  const [sh, sm] = pro.workStart.split(":").map(Number);
  const [eh, em] = pro.workEnd.split(":").map(Number);
  const [bh1, bm1] = pro.breakStart.split(":").map(Number);
  const [bh2, bm2] = pro.breakEnd.split(":").map(Number);
  const start = sh * 60 + sm;
  const end = eh * 60 + em;
  const breakStart = bh1 * 60 + bm1;
  const breakEnd = bh2 * 60 + bm2;
  const step = 30;
  const slots: string[] = [];

  for (let m = start; m + durationMin <= end; m += step) {
    if (m < breakEnd && m + durationMin > breakStart) continue;
    const h = String(Math.floor(m / 60)).padStart(2, "0");
    const mm = String(m % 60).padStart(2, "0");
    const time = `${h}:${mm}`;

    if (!bookingRepo.isSlotTaken(store.id, pro.id, date, time)) {
      slots.push(time);
    }
  }
  return slots;
}

export default function BookingPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const store = slug ? storeRepo.getById(slug) : undefined;

  const [step, setStep] = useState<Step>(1);
  const [sel, setSel] = useState<Selection>({ service: null, professional: null, date: null, time: null });
  const [success, setSuccess] = useState(false);
  const [thumb, setThumb] = useState(0);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [loginDetails, setLoginDetails] = useState({ name: "", phone: "" });
  const [loginError, setLoginError] = useState("");

  const days = useMemo(() => nextDays(14), []);

  if (!store) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm py-24">Estabelecimento não encontrado.</div>
        <Footer />
      </div>
    );
  }

  const loadedStore: Store = store;
  const cust = loadedStore.customization || {
    fontFamily: "Work Sans",
    fontSize: "base",
    primaryColor: "#2F6B6B",
    secondaryColor: "#EBF3F3",
    cardStyle: "quadrado",
    cardFill: "solido"
  };

  const primaryColor = cust.primaryColor || "#2F6B6B";
  const secondaryColor = cust.secondaryColor || "#EBF3F3";
  const cardBorderRadius = cust.cardStyle === "quadrado" ? "12px" : cust.cardStyle === "circular" ? "50%" : "50% 50% 0 0";
  const buttonBg = cust.cardFill === "gradient" ? `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` : primaryColor;

  const availableProfessionals = sel.service
    ? loadedStore.professionals.filter(p => p.serviceIds.includes(sel.service!.id))
    : loadedStore.professionals;

  const availableTimes = sel.professional && sel.date && sel.service
    ? generateTimesForDay(loadedStore, sel.professional, sel.date, sel.service.duration)
    : [];

  function select<K extends keyof Selection>(key: K, value: Selection[K]) {
    setSel(prev => {
      const next = { ...prev, [key]: value } as Selection;
      if (key === "service") { next.professional = null; next.date = null; next.time = null; }
      if (key === "professional") { next.date = null; next.time = null; }
      if (key === "date") { next.time = null; }
      return next;
    });
    if (key === "time") {
      const current = sessionRepo.get();
      if (!current || current.type !== "client") {
        setNeedsLogin(true);
        setStep(5);
        return;
      }
      setStep(5);
    } else {
      setStep(s => Math.min((["service", "professional", "date", "time"].indexOf(key) + 2), 5) as Step);
    }
  }

  function handleInlineLogin() {
    setLoginError("");
    if (!loginDetails.name.trim() || loginDetails.phone.replace(/\D/g, "").length < 10) {
      setLoginError("Preencha o nome completo e um telefone válido com DDD.");
      return;
    }
    sessionRepo.set({ type: "client", name: loginDetails.name, phone: loginDetails.phone });
    setNeedsLogin(false);
  }

  function confirmBooking() {
    const current = sessionRepo.get();
    if (!current || !sel.service || !sel.professional || !sel.date || !sel.time) return;

    // Persistência correta no localdb / localStorage
    bookingRepo.save({
      id: crypto.randomUUID(),
      storeId: loadedStore.id,
      serviceId: sel.service.id,
      professionalId: sel.professional.id,
      date: sel.date,
      time: sel.time,
      clientName: current.name,
      clientPhone: current.phone ?? "",
      status: "confirmado",
      price: sel.service.price,
      createdAt: new Date().toISOString(),
    });

    const message = `Olá! Confirmando meu agendamento em ${loadedStore.name}:\n` +
      `Serviço: ${sel.service.name}\nProfissional: ${sel.professional.name}\n` +
      `Data: ${sel.date}\nHorário: ${sel.time}`;
    window.open(buildWhatsAppLink(loadedStore.whatsapp, message), "_blank");

    setSuccess(true);
  }

  const dayLabel = (d: Date) => `${WEEKDAY_LABEL[d.getDay()]}, ${d.getDate()} ${MONTH_LABEL[d.getMonth()]}`;

  const dayAvailable = (d: Date) => {
    if (!sel.professional) return false;
    const iso = toISODate(d);
    if (loadedStore.establishment.holidays.includes(iso)) return false;
    if (!sel.professional.workDays.includes(d.getDay())) return false;
    return generateTimesForDay(loadedStore, sel.professional, iso, sel.service?.duration ?? 30).length > 0;
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col" style={{ fontFamily: cust.fontFamily }}>
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ background: secondaryColor }}>
            <svg className="w-10 h-10" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3" style={{ fontFamily: cust.fontFamily }}>Agendamento concluído!</h2>
          <p className="text-sm text-gray-400 mb-8">O compromisso já está visível na sua aba de "Meus Agendamentos".</p>
          <div className="flex gap-4">
            <button onClick={() => navigate("/perfil")} className="px-6 py-3 rounded-xl text-white text-sm font-semibold shadow-sm" style={{ background: primaryColor }}>Ver Meus Agendamentos</button>
            <button onClick={() => navigate("/")} className="px-6 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Voltar ao início</button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" style={{ fontFamily: cust.fontFamily }}>
      <Header />

      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{ color: primaryColor }}>{loadedStore.name}</h1>
          <p className="text-sm text-gray-500">{loadedStore.category} · {loadedStore.address}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 w-full">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Faça seu agendamento</h2>

        <div className="space-y-3">
          {/* Etapa 1: Serviço */}
          <div>
            <div className={`flex items-center gap-4 p-4 rounded-xl ${step === 1 ? "bg-white shadow-sm border border-gray-100" : "bg-gray-50 opacity-60"}`}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold" style={{ background: step > 1 ? primaryColor : "transparent", color: step > 1 ? "#fff" : primaryColor, border: step === 1 ? `2px solid ${primaryColor}` : "none" }}>{step > 1 ? "✓" : 1}</div>
              <p className="text-sm font-semibold text-gray-800">Escolha o Serviço</p>
            </div>
            {step === 1 && (
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {loadedStore.services.map(s => (
                  <button key={s.id} onClick={() => select("service", s)}
                    className="text-left p-4 rounded-xl border transition-all"
                    style={{ borderRadius: cardBorderRadius, background: sel.service?.id === s.id ? secondaryColor : "#fff", borderColor: sel.service?.id === s.id ? primaryColor : "#f3f4f6" }}>
                    <p className="font-medium text-gray-800 text-sm">{s.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-400">{s.duration} min</span>
                      <span className="text-sm font-semibold" style={{ color: primaryColor }}>R$ {s.price.toFixed(2)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Etapa 2: Profissional */}
          <div>
            <div className={`flex items-center gap-4 p-4 rounded-xl ${step === 2 ? "bg-white shadow-sm border border-gray-100" : "bg-gray-50 opacity-60"}`}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold" style={{ background: step > 2 ? primaryColor : "transparent", color: step > 2 ? "#fff" : primaryColor, border: step === 2 ? `2px solid ${primaryColor}` : "2px solid #e5e7eb" }}>{step > 2 ? "✓" : 2}</div>
              <p className="text-sm font-semibold text-gray-800">Escolha o Profissional</p>
            </div>
            {step === 2 && (
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {availableProfessionals.map(p => (
                  <button key={p.id} onClick={() => select("professional", p)}
                    className="p-4 rounded-xl border text-center transition-all"
                    style={{ borderRadius: cardBorderRadius, background: sel.professional?.id === p.id ? secondaryColor : "#fff", borderColor: sel.professional?.id === p.id ? primaryColor : "#f3f4f6" }}>
                    <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-2"><img src={p.photo} alt={p.name} className="w-full h-full object-cover" /></div>
                    <p className="font-medium text-gray-800 text-sm">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.role}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Etapa 3: Data */}
          <div>
            <div className={`flex items-center gap-4 p-4 rounded-xl ${step === 3 ? "bg-white shadow-sm border border-gray-100" : "bg-gray-50 opacity-60"}`}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold" style={{ background: step > 3 ? primaryColor : "transparent", color: step > 3 ? "#fff" : primaryColor, border: step === 3 ? `2px solid ${primaryColor}` : "2px solid #e5e7eb" }}>{step > 3 ? "✓" : 3}</div>
              <p className="text-sm font-semibold text-gray-800">Escolha a Data</p>
            </div>
            {step === 3 && (
              <div className="mt-2 bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {days.map(d => {
                    const iso = toISODate(d);
                    const available = dayAvailable(d);
                    return (
                      <button key={iso} onClick={() => available && select("date", iso)} disabled={!available}
                        className="shrink-0 px-4 py-3 rounded-xl text-sm font-medium border transition-all"
                        style={{ background: sel.date === iso ? primaryColor : "#fff", color: sel.date === iso ? "#fff" : available ? "#374151" : "#9ca3af", borderColor: sel.date === iso ? primaryColor : "#e5e7eb", opacity: available ? 1 : 0.35 }}>
                        {dayLabel(d)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Etapa 4: Horário */}
          <div>
            <div className={`flex items-center gap-4 p-4 rounded-xl ${step === 4 ? "bg-white shadow-sm border border-gray-100" : "bg-gray-50 opacity-60"}`}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold" style={{ background: step > 4 ? primaryColor : "transparent", color: step > 4 ? "#fff" : primaryColor, border: step === 4 ? `2px solid ${primaryColor}` : "2px solid #e5e7eb" }}>{step > 4 ? "✓" : 4}</div>
              <p className="text-sm font-semibold text-gray-800">Escolha o Horário</p>
            </div>
            {step === 4 && (
              <div className="mt-2 bg-white rounded-xl border border-gray-100 p-4">
                {availableTimes.length === 0 ? (
                  <p className="text-sm text-gray-400">Nenhum horário disponível para esta data.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {availableTimes.map(t => (
                      <button key={t} onClick={() => select("time", t)}
                        className="px-4 py-2 rounded-xl text-sm font-medium border transition-all"
                        style={{ background: sel.time === t ? primaryColor : "#fff", color: sel.time === t ? "#fff" : "#374151", borderColor: sel.time === t ? primaryColor : "#e5e7eb" }}>
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Etapa 5: Confirmação / Login Inline com Máscara */}
          <div>
            <div className={`flex items-center gap-4 p-4 rounded-xl ${step === 5 ? "bg-white shadow-sm border border-gray-100" : "bg-gray-50 opacity-60"}`}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 border-gray-200 text-gray-400">5</div>
              <p className="text-sm font-semibold text-gray-800">Confirmação</p>
            </div>
            {step === 5 && needsLogin && (
              <div className="mt-2 bg-white rounded-xl border border-gray-100 p-6">
                <p className="text-sm text-gray-600 mb-4">Informe seus dados para finalizar o agendamento:</p>
                <div className="space-y-3 max-w-sm">
                  <input
                    placeholder="Nome completo"
                    value={loginDetails.name}
                    onChange={e => setLoginDetails(p => ({ ...p, name: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2F6B6B]"
                  />
                  <input
                    placeholder="Celular (ex: (11) 99999-9999)"
                    value={loginDetails.phone}
                    onChange={e => setLoginDetails(p => ({ ...p, phone: formatPhone(e.target.value) }))}
                    maxLength={15}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2F6B6B]"
                  />
                  {loginError && <p className="text-xs text-red-500 font-medium">{loginError}</p>}
                  <button
                    onClick={handleInlineLogin}
                    className="w-full py-3 rounded-xl text-white text-sm font-semibold shadow-sm"
                    style={{ background: buttonBg }}
                  >
                    Salvar e Continuar
                  </button>
                </div>
              </div>
            )}
            {step === 5 && !needsLogin && (
              <div className="mt-2 bg-white rounded-xl border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Resumo do Agendamento</h3>
                <div className="space-y-3 mb-6">
                  {[
                    { label: "Serviço", value: `${sel.service?.name} — R$ ${sel.service?.price.toFixed(2)}` },
                    { label: "Profissional", value: sel.professional?.name },
                    { label: "Data", value: sel.date },
                    { label: "Horário", value: sel.time },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                      <span className="text-sm text-gray-500">{row.label}</span>
                      <span className="text-sm font-medium text-gray-800">{row.value}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Editar</button>
                  <button onClick={confirmBooking} className="flex-1 py-3 rounded-xl text-white text-sm font-semibold transition-colors shadow-sm" style={{ background: buttonBg }}>Confirmar Agendamento</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}