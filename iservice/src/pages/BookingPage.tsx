import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ToastContainer, { type ToastMessage } from "../components/Toast";
import {
  storeRepo, bookingRepo, sessionRepo, buildWhatsAppLink,
  type PublicStore, type Service, type Professional,
} from "../lib/db";
import { formatPhone, isValidPhone } from "../utils/masks";

type Step = 1 | 2 | 3 | 4 | 5;

const WEEKDAY_LABEL = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTH_LABEL = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const EMPTY_PUBLIC_STORE: PublicStore = {
  id: "",
  loginId: "",
  username: "",
  name: "",
  category: "",
  address: "",
  phone: "",
  whatsapp: "",
  status: "pendente",
  preferredContact: "whatsapp",
  featured: false,
  gallery: [],
  amenities: [],
  services: [],
  professionals: [],
  establishment: { workDays: [], openTime: "08:00", closeTime: "20:00", holidays: [] },
  customization: {
    fontFamily: "Work Sans",
    fontSize: "base",
    primaryColor: "#2F6B6B",
    secondaryColor: "#EBF3F3",
    cardStyle: "quadrado",
    cardFill: "solido",
  },
  financeClosingDay: 0,
  createdAt: "",
};

function toISODate(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDatePTBR(isoDate: string) {
  const parts = isoDate.split("-");
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : isoDate;
}

function nextDays(n: number) {
  const out: Date[] = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    out.push(d);
  }
  return out;
}

function formatDuration(totalMinutes: number) {
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hrs === 0) return `${mins} min`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}min`;
}

function generateTimesForDay(
  store: Pick<PublicStore, "id" | "establishment">,
  pro: Professional,
  date: string,
  durationMin: number,
): string[] {
  const [sh, sm] = pro.workStart.split(":").map(Number);
  const [eh, em] = pro.workEnd.split(":").map(Number);
  const [bh1, bm1] = pro.breakStart.split(":").map(Number);
  const [bh2, bm2] = pro.breakEnd.split(":").map(Number);
  const [openingHour, openingMinute] = store.establishment.openTime.split(":").map(Number);
  const [closingHour, closingMinute] = store.establishment.closeTime.split(":").map(Number);
  const start = Math.max(sh * 60 + sm, openingHour * 60 + openingMinute);
  const end = Math.min(eh * 60 + em, closingHour * 60 + closingMinute);
  const breakStart = bh1 * 60 + bm1;
  const breakEnd = bh2 * 60 + bm2;
  const step = 30;
  const slots: string[] = [];
  const today = toISODate(new Date());
  const isToday = date === today;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (let m = start; m + durationMin <= end; m += step) {
    if (m < breakEnd && m + durationMin > breakStart) continue;
    if (isToday && m <= currentMinutes) continue;
    const h = String(Math.floor(m / 60)).padStart(2, "0");
    const mm = String(m % 60).padStart(2, "0");
    const time = `${h}:${mm}`;

    if (!bookingRepo.isSlotTaken(store.id, pro.id, date, m, durationMin)) {
      slots.push(time);
    }
  }
  return slots;
}

export default function BookingPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const store = slug ? storeRepo.getPublicById(slug) : undefined;

  const [step, setStep] = useState<Step>(1);

  // Estado da Sacola Multi-serviços
  const [cartItems, setCartItems] = useState<Service[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const [success, setSuccess] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [loginDetails, setLoginDetails] = useState<{
    name: string;
    phone: string;
    preferredContact: "whatsapp" | "sms" | "email";
  }>({
    name: "",
    phone: "",
    preferredContact: "whatsapp" as const,
  });
  const [loginError, setLoginError] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const loadedStore = store ?? EMPTY_PUBLIC_STORE;
  const days = useMemo(() => nextDays(14), []);
  const totalCartPrice = useMemo(
    () => cartItems.reduce((total, item) => total + (Number.isFinite(item.price) ? item.price : 0), 0),
    [cartItems],
  );
  const totalCartDuration = useMemo(
    () => cartItems.reduce((total, item) => total + (Number.isFinite(item.duration) ? item.duration : 0), 0),
    [cartItems],
  );
  const availableProfessionals = useMemo(() => {
    if (cartItems.length === 0) return loadedStore.professionals;
    return loadedStore.professionals.filter((professional) =>
      cartItems.every((service) => professional.serviceIds.includes(service.id)),
    );
  }, [cartItems, loadedStore.professionals]);
  const availableTimes = useMemo(() => {
    if (!store || !selectedProfessional || !selectedDate || totalCartDuration <= 0) return [];
    return generateTimesForDay(loadedStore, selectedProfessional, selectedDate, totalCartDuration);
  }, [loadedStore, selectedDate, selectedProfessional, store, totalCartDuration]);
  const morningTimes = useMemo(
    () => availableTimes.filter((time) => Number(time.split(":")[0]) < 12),
    [availableTimes],
  );
  const afternoonTimes = useMemo(
    () => availableTimes.filter((time) => {
      const hour = Number(time.split(":")[0]);
      return hour >= 12 && hour < 18;
    }),
    [availableTimes],
  );
  const nightTimes = useMemo(
    () => availableTimes.filter((time) => Number(time.split(":")[0]) >= 18),
    [availableTimes],
  );

  const cust = loadedStore.customization;
  const fontSizeClass = cust.fontSize === "sm" ? "text-sm" : cust.fontSize === "lg" ? "text-lg" : "text-base";
  const primaryColor = cust.primaryColor || "#2F6B6B";
  const secondaryColor = cust.secondaryColor || "#EBF3F3";
  const cardBorderRadius = cust.cardStyle === "quadrado" ? "12px" : cust.cardStyle === "circular" ? "50%" : "50% 50% 0 0";
  const buttonBg = cust.cardFill === "gradient" ? `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` : primaryColor;

  useEffect(() => {
    const supportedFonts = ["Work Sans", "Playfair Display", "Inter", "Lora", "Poppins"];
    if (!supportedFonts.includes(cust.fontFamily)) return;

    const linkId = "booking-google-font";
    let link = document.getElementById(linkId) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(cust.fontFamily).replace(/%20/g, "+")}:wght@400;500;600;700&display=swap`;
  }, [cust.fontFamily]);

  function addToast(text: string, type: ToastMessage["type"] = "info") {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, text, type }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4000);
  }

  if (!store) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 text-sm py-24 text-center px-4">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Estabelecimento indisponível ou inativo</h2>
          <p className="text-sm text-gray-400 mb-6">Esta barbearia ou salão pode estar temporariamente desativado na plataforma.</p>
          <button
            onClick={() => navigate("/")}
            className="px-5 py-2.5 rounded-xl bg-[#2F6B6B] text-white text-sm font-semibold"
          >
            Voltar ao início
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  function toggleService(service: Service) {
    setCartItems(prev => {
      const exists = prev.some(item => item.id === service.id);
      if (exists) {
        return prev.filter(item => item.id !== service.id);
      } else {
        return [...prev, service];
      }
    });
    // Resetar seleções posteriores se alterar a sacola
    setSelectedProfessional(null);
    setSelectedDate(null);
    setSelectedTime(null);
  }

  function handleProceedToProfessional() {
    if (cartItems.length === 0) return;
    setStep(2);
  }

  function handleSelectProfessional(pro: Professional) {
    setSelectedProfessional(pro);
    setSelectedDate(null);
    setSelectedTime(null);
    setStep(3);
  }

  function handleSelectDate(dateStr: string) {
    setSelectedDate(dateStr);
    setSelectedTime(null);
    setStep(4);
  }

  function handleSelectTime(timeStr: string) {
    setSelectedTime(timeStr);
    setBookingError("");
    const current = sessionRepo.get();
    if (!current || current.type !== "client") {
      setNeedsLogin(true);
      setStep(5);
      return;
    }
    setStep(5);
  }

  function handleInlineLogin() {
    setLoginError("");
    if (!loginDetails.name.trim()) {
      setLoginError("Informe seu nome completo.");
      return;
    }
    if (!isValidPhone(loginDetails.phone)) {
      setLoginError("Informe um telefone válido com DDD (10 ou 11 dígitos).");
      return;
    }
    sessionRepo.set({
      type: "client",
      name: loginDetails.name.trim(),
      phone: loginDetails.phone,
      preferredContact: loginDetails.preferredContact,
    });
    setNeedsLogin(false);
  }

  function confirmBooking() {
    const current = sessionRepo.get();
    if (!current || cartItems.length === 0 || !selectedProfessional || !selectedDate || !selectedTime) return;

    const [startHour, startMinute] = selectedTime.split(":").map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const today = toISODate(new Date());
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    if (selectedDate < today || (selectedDate === today && startMinutes <= currentMinutes)) {
      setBookingError("Este horário já passou. Escolha outro horário disponível.");
      setSelectedTime(null);
      setStep(4);
      return;
    }
    if (
      bookingRepo.isSlotTaken(
        loadedStore.id,
        selectedProfessional.id,
        selectedDate,
        startMinutes,
        totalCartDuration,
      )
    ) {
      setBookingError("Este horário acabou de ser reservado. Escolha outro horário disponível.");
      setSelectedTime(null);
      setStep(4);
      return;
    }

    const endMinutes = startMinutes + totalCartDuration;
    const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;
    const serviceNamesSummary = cartItems.map(s => s.name).join(" + ");
    const preferredContact = current.preferredContact ?? "whatsapp";

    bookingRepo.save({
      id: crypto.randomUUID(),
      storeId: loadedStore.id,
      serviceId: cartItems[0].id,
      items: cartItems.map(({ id, name, price, duration }) => ({ id, name, price, duration })),
      durationMin: totalCartDuration,
      endTime,
      professionalId: selectedProfessional.id,
      date: selectedDate,
      time: selectedTime,
      clientName: current.name,
      clientPhone: current.phone ?? "",
      preferredContact,
      status: "confirmado",
      price: totalCartPrice,
      createdAt: new Date().toISOString(),
    });

    const message = `Olá! Confirmando meu agendamento em ${loadedStore.name}:\n` +
      `Serviços: ${serviceNamesSummary}\nProfissional: ${selectedProfessional.name}\n` +
      `Data: ${formatDatePTBR(selectedDate)}\nHorário: ${selectedTime} às ${endTime} (${formatDuration(totalCartDuration)})`;
    if (preferredContact === "whatsapp") {
      const whatsappLink = buildWhatsAppLink(loadedStore.whatsapp, message);
      if (whatsappLink) window.open(whatsappLink, "_blank", "noopener,noreferrer");
      else addToast("Agendamento salvo, mas o estabelecimento não cadastrou um WhatsApp para contato.");
    } else {
      addToast(`Agendamento salvo. A preferência selecionada foi ${preferredContact}; o envio automático por esse canal não está disponível.`);
    }

    setSuccess(true);
  }

  const dayLabel = (d: Date) => `${WEEKDAY_LABEL[d.getDay()]}, ${d.getDate()} ${MONTH_LABEL[d.getMonth()]}`;

  const dayAvailable = (d: Date) => {
    if (!selectedProfessional || totalCartDuration === 0) return false;
    const iso = toISODate(d);
    if (loadedStore.establishment.holidays.includes(iso)) return false;
    if (!loadedStore.establishment.workDays.includes(d.getDay())) return false;
    if (!selectedProfessional.workDays.includes(d.getDay())) return false;
    return generateTimesForDay(loadedStore, selectedProfessional, iso, totalCartDuration).length > 0;
  };

  function continueBooking() {
    if (step === 1) {
      handleProceedToProfessional();
    } else if (step === 2 && selectedProfessional) {
      setStep(3);
    } else if (step === 3 && selectedDate) {
      handleSelectDate(selectedDate);
    } else if (step === 4 && selectedTime) {
      handleSelectTime(selectedTime);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col" style={{ fontFamily: cust.fontFamily }}>
        <Header />
        <ToastContainer
          toasts={toasts}
          onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))}
        />
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ background: secondaryColor }}>
            <svg className="w-10 h-10" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3" style={{ fontFamily: cust.fontFamily }}>Agendamento concluído!</h2>
          <p className="text-sm text-gray-400 mb-8">O compromisso com múltiplos serviços já está visível na sua aba de "Meus Agendamentos".</p>
          <div className="flex gap-4">
            <button onClick={() => navigate("/cliente/agendamentos")} className="px-6 py-3 rounded-xl text-white text-sm font-semibold shadow-sm" style={{ background: primaryColor }}>Ver Meus Agendamentos</button>
            <button onClick={() => navigate("/")} className="px-6 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Voltar ao início</button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col bg-gray-50 pb-32 ${fontSizeClass}`} style={{ fontFamily: cust.fontFamily }}>
      <Header />
    <ToastContainer
      toasts={toasts}
      onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))}
    />

      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{ color: primaryColor }}>{loadedStore.name}</h1>
          <p className="text-sm text-gray-500">{loadedStore.category} · {loadedStore.address}</p>
          {loadedStore.amenities.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {loadedStore.amenities.map(amenity => (
                <span key={amenity} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                  ✓ {amenity}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Monte seu atendimento</h2>
          {cartItems.length > 0 && (
            <span className="text-xs px-3 py-1 rounded-full font-medium bg-[#EBF3F3] text-[#2F6B6B]">
              {cartItems.length} {cartItems.length === 1 ? "serviço selecionado" : "serviços selecionados"}
            </span>
          )}
        </div>

        <div className="space-y-4">
          {/* Etapa 1: Serviços (Multi-Select Sacola) */}
          <div>
            <button
              type="button"
              disabled={step === 1}
              onClick={() => setStep(1)}
              className={`w-full text-left flex items-center gap-4 p-4 rounded-xl ${step === 1 ? "bg-white shadow-sm border border-gray-100" : "bg-gray-50 opacity-80 cursor-pointer hover:bg-white"}`}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold" style={{ background: step > 1 ? primaryColor : "transparent", color: step > 1 ? "#fff" : primaryColor, border: step === 1 ? `2px solid ${primaryColor}` : "none" }}>{step > 1 ? "✓" : 1}</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">Escolha os Serviços (Adicione um ou mais)</p>
                {cartItems.length > 0 && <p className="text-xs text-[#2F6B6B]">{cartItems.map(i => i.name).join(", ")}</p>}
              </div>
              {step > 1 && <span className="text-xs text-[#2F6B6B] font-medium underline">Editar</span>}
            </button>

            {step === 1 && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {loadedStore.services.map(s => {
                  const isSelected = cartItems.some(item => item.id === s.id);
                  const validPrice = Number.isFinite(s.price) && s.price >= 0;
                  const validDuration = Number.isFinite(s.duration) && s.duration > 0;
                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        if (!validPrice || !validDuration) {
                          const error = "Este serviço está com preço ou duração inválidos. Entre em contato com o estabelecimento.";
                          setBookingError(error);
                          addToast(error, "error");
                          return;
                        }
                        setBookingError("");
                        toggleService(s);
                      }}
                      className="text-left p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between"
                      style={{
                        borderRadius: cardBorderRadius,
                        background: isSelected ? secondaryColor : "#fff",
                        borderColor: isSelected ? primaryColor : "#f3f4f6",
                        outline: isSelected ? `2px solid ${primaryColor}` : undefined,
                        outlineOffset: isSelected ? "1px" : undefined,
                      }}
                    >
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{s.name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-400">{s.duration} min</span>
                          <span className="text-sm font-semibold" style={{ color: primaryColor }}>
                            {validPrice ? `R$ ${s.price.toFixed(2)}` : "Preço indisponível"}
                          </span>
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors ${isSelected ? "border-brand [#2F6B6B] border-[#2F6B6B] text-white" : "border-gray-300 bg-white"}`}>
                        {isSelected && <span className="text-xs font-bold">✓</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Etapa 2: Profissional */}
          <div>
            <button
              type="button"
              disabled={step <= 2 || !selectedProfessional}
              onClick={() => setStep(2)}
              className={`w-full text-left flex items-center gap-4 p-4 rounded-xl ${step === 2 ? "bg-white shadow-sm border border-gray-100" : step > 2 ? "bg-white border border-gray-100 cursor-pointer hover:bg-gray-50" : "bg-gray-50 opacity-60 cursor-not-allowed"}`}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold" style={{ background: step > 2 ? primaryColor : "transparent", color: step > 2 ? "#fff" : primaryColor, border: step === 2 ? `2px solid ${primaryColor}` : "2px solid #e5e7eb" }}>{step > 2 ? "✓" : 2}</div>
              <p className="text-sm font-semibold text-gray-800">Escolha o Profissional</p>
              {step > 2 && <span className="ml-auto text-xs text-[#2F6B6B] font-medium underline">Editar</span>}
            </button>
            {step === 2 && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {availableProfessionals.map(p => (
                  <button key={p.id} onClick={() => handleSelectProfessional(p)}
                    className="p-4 rounded-xl border text-center transition-all"
                    style={{ borderRadius: cardBorderRadius, background: selectedProfessional?.id === p.id ? secondaryColor : "#fff", borderColor: selectedProfessional?.id === p.id ? primaryColor : "#f3f4f6" }}>
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
            <button
              type="button"
              disabled={step <= 3 || !selectedDate}
              onClick={() => setStep(3)}
              className={`w-full text-left flex items-center gap-4 p-4 rounded-xl ${step === 3 ? "bg-white shadow-sm border border-gray-100" : step > 3 ? "bg-white border border-gray-100 cursor-pointer hover:bg-gray-50" : "bg-gray-50 opacity-60 cursor-not-allowed"}`}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold" style={{ background: step > 3 ? primaryColor : "transparent", color: step > 3 ? "#fff" : primaryColor, border: step === 3 ? `2px solid ${primaryColor}` : "2px solid #e5e7eb" }}>{step > 3 ? "✓" : 3}</div>
              <p className="text-sm font-semibold text-gray-800">Escolha a Data</p>
              {step > 3 && <span className="ml-auto text-xs text-[#2F6B6B] font-medium underline">Editar</span>}
            </button>
            {step === 3 && (
              <div className="mt-3 bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {days.map(d => {
                    const iso = toISODate(d);
                    const available = dayAvailable(d);
                    return (
                      <button key={iso} onClick={() => available && handleSelectDate(iso)} disabled={!available}
                        className="shrink-0 px-4 py-3 rounded-xl text-sm font-medium border transition-all"
                        style={{ background: selectedDate === iso ? primaryColor : "#fff", color: selectedDate === iso ? "#fff" : available ? "#374151" : "#9ca3af", borderColor: selectedDate === iso ? primaryColor : "#e5e7eb", opacity: available ? 1 : 0.35 }}>
                        {dayLabel(d)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Etapa 4: Horários agrupados por turno */}
          <div>
            <button
              type="button"
              disabled={step <= 4 || !selectedTime}
              onClick={() => setStep(4)}
              className={`w-full text-left flex items-center gap-4 p-4 rounded-xl ${step === 4 ? "bg-white shadow-sm border border-gray-100" : step > 4 ? "bg-white border border-gray-100 cursor-pointer hover:bg-gray-50" : "bg-gray-50 opacity-60 cursor-not-allowed"}`}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold" style={{ background: step > 4 ? primaryColor : "transparent", color: step > 4 ? "#fff" : primaryColor, border: step === 4 ? `2px solid ${primaryColor}` : "2px solid #e5e7eb" }}>{step > 4 ? "✓" : 4}</div>
              <p className="text-sm font-semibold text-gray-800">Escolha o Horário (Considerando a duração total de {formatDuration(totalCartDuration)})</p>
              {step > 4 && <span className="ml-auto text-xs text-[#2F6B6B] font-medium underline">Editar</span>}
            </button>
            {step === 4 && (
              <div className="mt-3 bg-white rounded-xl border border-gray-100 p-6 space-y-6">
                {bookingError && <p role="alert" className="text-sm text-red-600">{bookingError}</p>}
                {availableTimes.length === 0 ? (
                  <p className="text-sm text-gray-400">Nenhum horário disponível para esta carga horária nesta data.</p>
                ) : (
                  <>
                    {[
                      { label: "Manhã", icon: "☀️", times: morningTimes },
                      { label: "Tarde", icon: "🌤️", times: afternoonTimes },
                      { label: "Noite", icon: "🌙", times: nightTimes },
                    ].map(group => group.times.length > 0 && (
                      <section key={group.label}>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
                          <span aria-hidden="true">{group.icon}</span> {group.label}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {group.times.map(time => (
                            <button
                              key={time}
                              type="button"
                              onClick={() => handleSelectTime(time)}
                              className="px-4 py-2 rounded-xl text-sm font-medium border transition-all"
                              style={{
                                background: selectedTime === time ? primaryColor : "#fff",
                                color: selectedTime === time ? "#fff" : "#374151",
                                borderColor: selectedTime === time ? primaryColor : "#e5e7eb",
                              }}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </section>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Etapa 5: Confirmação / Login Inline */}
          <div>
            <div className={`flex items-center gap-4 p-4 rounded-xl ${step === 5 ? "bg-white shadow-sm border border-gray-100" : "bg-gray-50 opacity-60"}`}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 border-gray-200 text-gray-400">5</div>
              <p className="text-sm font-semibold text-gray-800">Confirmação da Sacola</p>
            </div>
            {step === 5 && needsLogin && (
              <div className="mt-3 bg-white rounded-xl border border-gray-100 p-6">
                <p className="text-sm text-gray-600 mb-4">Informe seus dados para finalizar o agendamento:</p>
                <div className="space-y-3 max-w-sm">
                  <input
                    placeholder="Nome completo"
                    value={loginDetails.name}
                    onChange={e => setLoginDetails(p => ({ ...p, name: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand [#2F6B6B]"
                  />
                  <input
                    placeholder="Celular (ex: (11) 99999-9999)"
                    value={loginDetails.phone}
                    onChange={e => setLoginDetails(p => ({ ...p, phone: formatPhone(e.target.value) }))}
                    maxLength={15}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand [#2F6B6B]"
                  />
                  <label className="block text-xs font-semibold text-gray-600">
                    Preferência de contato
                    <select
                      value={loginDetails.preferredContact}
                      onChange={e => setLoginDetails(p => ({
                        ...p,
                        preferredContact: e.target.value as "whatsapp" | "sms" | "email",
                      }))}
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-normal"
                    >
                      <option value="whatsapp">WhatsApp</option>
                      <option value="sms">SMS</option>
                      <option value="email">E-mail</option>
                    </select>
                  </label>
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
              <div className="mt-3 bg-white rounded-xl border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Resumo da Sacola de Serviços</h3>
                <div className="space-y-3 mb-6">
                  <div className="py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-500 block mb-1">Serviços Selecionados:</span>
                    <ul className="space-y-1">
                      {cartItems.map(item => (
                        <li key={item.id} className="text-sm font-medium text-gray-800 flex justify-between">
                          <span>• {item.name} ({item.duration} min)</span>
                          <span>{Number.isFinite(item.price) ? `R$ ${item.price.toFixed(2)}` : "Preço indisponível"}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {[
                    { label: "Tempo Total Estimado", value: formatDuration(totalCartDuration) },
                    { label: "Profissional", value: selectedProfessional?.name },
                    { label: "Data e Horário", value: `${selectedDate ? formatDatePTBR(selectedDate) : ""} às ${selectedTime}` },
                    { label: "Valor Total", value: `R$ ${totalCartPrice.toFixed(2)}` },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                      <span className="text-sm text-gray-500">{row.label}</span>
                      <span className="text-sm font-semibold text-gray-900">{row.value}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Editar Sacola</button>
                  <button onClick={confirmBooking} className="flex-1 py-3 rounded-xl text-white text-sm font-semibold transition-colors shadow-sm" style={{ background: buttonBg }}>Confirmar Agendamento</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sacola Flutuante / Bottom Bar (Padrão iFood) */}
      {cartItems.length > 0 && step < 5 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-gray-200 shadow-lg p-4 animate-in slide-in-from-bottom duration-300">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full animate-pulse" style={{ background: primaryColor }}></span>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Sacola iService</p>
              </div>
              <p className="text-sm font-bold text-gray-900">
                {cartItems.length} {cartItems.length === 1 ? "serviço" : "serviços"} · <span style={{ color: primaryColor }}>R$ {totalCartPrice.toFixed(2)}</span>
              </p>
              <p className="text-xs text-gray-400">Duração estimada: {formatDuration(totalCartDuration)}</p>
            </div>
            <button
                onClick={continueBooking}
                disabled={
                  (step === 1 && cartItems.length === 0) ||
                  (step === 2 && !selectedProfessional) ||
                  (step === 3 && !selectedDate) ||
                  (step === 4 && !selectedTime)
                }
                className="w-full sm:w-auto justify-center px-6 py-3 rounded-xl text-white text-sm font-semibold shadow-md transition-all hover:opacity-90 flex items-center gap-2"
                style={{ background: buttonBg, opacity: (step === 2 && !selectedProfessional) || (step === 3 && !selectedDate) || (step === 4 && !selectedTime) ? 0.5 : 1 }}
              >
                {step === 1 ? "Avançar para Profissional" : step === 2 ? "Avançar para Data" : step === 3 ? "Avançar para Horário" : "Continuar para Confirmação"} &rarr;
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}