// Camada de dados compartilhada. Tudo passa por aqui — nenhuma outra
// parte do app deve ler/escrever no localStorage diretamente.

export interface Service {
  id: string;
  name: string;
  duration: number; // minutos
  price: number;
}

export interface Professional {
  id: string;
  name: string;
  role: string;
  photo: string;
  serviceIds: string[];
  workDays: number[]; // 0=domingo ... 6=sábado
  workStart: string;
  workEnd: string;
  breakStart: string;
  breakEnd: string;
}

export interface Booking {
  id: string;
  storeId: string;
  serviceId: string;
  items?: BookingItem[];
  durationMin?: number;
  endTime?: string;
  professionalId: string;
  date: string;
  time: string;
  clientName: string;
  clientPhone: string;
  preferredContact?: "whatsapp" | "sms" | "email";
  status: "confirmado" | "concluído" | "cancelado";
  price: number;
  createdAt: string;
}

export interface BookingItem {
  id: string;
  name: string;
  price: number;
  duration: number;
}

export interface Customization {
  fontFamily: string;
  fontSize: "sm" | "base" | "lg";
  primaryColor: string;
  secondaryColor: string;
  cardStyle: "quadrado" | "circular" | "semicirculo";
  cardFill: "solido" | "gradient";
}

export interface Establishment {
  workDays: number[];
  openTime: string;
  closeTime: string;
  holidays: string[];
}

export interface Store {
  id: string;
  loginId: string;
  passwordHash: string;
  username: string;
  name: string;
  category: string;
  address: string;
  phone: string;
  whatsapp: string;
  status: "pendente" | "ativo" | "suspenso" | "desativado";
  availabilityStatus?: "Ativo" | "Inativo";
  plano?: "Grátis" | "Pro" | "Enterprise";
  preferredContact: "phone" | "whatsapp" | "email";
  featured: boolean;
  deactivatedAt?: string;
  gallery: string[];
  amenities: string[];
  services: Service[];
  professionals: Professional[];
  establishment: Establishment;
  customization: Customization;
  financeClosingDay: number;
  createdAt: string;
}

export type PublicStore = Omit<Store, "passwordHash">;

export interface Ticket {
  id: string;
  from: string;
  subject: string;
  status: "aberto" | "fechado";
  messages: { sender: string; text: string; time: string }[];
}

export interface StoreSupportTicket {
  id: string;
  storeId: string;
  subject: string;
  category: string;
  message: string;
  adminReply?: string;
  status: "Em Aberto" | "Respondido";
  createdAt: string;
}

export interface Session {
  type: "client" | "lojista" | "admin";
  name: string;
  email?: string;
  phone?: string;
  preferredContact?: "whatsapp" | "sms" | "email";
  storeId?: string;
}

export type Category = { name: string; emoji: string; slug: string };

const KEYS = {
  stores: "iservice_stores",
  bookings: "iservice_bookings",
  categories: "iservice_categories",
  tickets: "iservice_tickets",
  storeTickets: "iservice_tickets_v1",
  session: "iservice_session",
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function generateLoginId(): string {
  return String(Math.floor(10000000 + Math.random() * 90000000));
}

export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const DEFAULT_CATEGORIES: Category[] = [
  { name: "Barbearia", emoji: "✂️", slug: "barbearia" },
  { name: "Salão de Beleza", emoji: "💇", slug: "salao" },
  { name: "Estética", emoji: "✨", slug: "estetica" },
  { name: "Spa & Bem-estar", emoji: "🧘", slug: "spa" },
  { name: "Manicure & Pedicure", emoji: "💅", slug: "manicure" },
  { name: "Depilação", emoji: "🌸", slug: "depilacao" },
  { name: "Massoterapia", emoji: "💆", slug: "massoterapia" },
  { name: "Tatuagem & Piercing", emoji: "🎨", slug: "tatuagem" },
  { name: "Academia & Personal Trainer", emoji: "🏋️", slug: "academia" },
  { name: "Nutrição", emoji: "🥗", slug: "nutricao" },
  { name: "Fisioterapia", emoji: "🩺", slug: "fisioterapia" },
  { name: "Psicologia & Terapia", emoji: "🧠", slug: "psicologia" },
  { name: "Odontologia", emoji: "🦷", slug: "odontologia" },
  { name: "Pet Shop & Veterinário", emoji: "🐾", slug: "petshop" },
  { name: "Estética Automotiva", emoji: "🚗", slug: "automotiva" },
  { name: "Fotografia", emoji: "📷", slug: "fotografia" },
  { name: "Aulas Particulares", emoji: "📚", slug: "aulas" },
  { name: "Outro", emoji: "➕", slug: "outro" },
];

export const categoriesRepo = {
  getAll(): Category[] {
    return read(KEYS.categories, DEFAULT_CATEGORIES);
  },
  getAllNames(): string[] {
    return categoriesRepo.getAll().map((c) => c.name);
  },
  add(name: string, emoji = "🏷️") {
    const cats = categoriesRepo.getAll();
    if (!cats.some((c) => c.name === name)) {
      write(KEYS.categories, [...cats, { name, emoji, slug: name.toLowerCase().replace(/\s+/g, "-") }]);
    }
  },
  remove(name: string) {
    write(KEYS.categories, categoriesRepo.getAll().filter((c) => c.name !== name));
  },
};

export const storeRepo = {
  getAll(): Store[] {
    return read(KEYS.stores, []);
  },
  getById(id: string): Store | undefined {
    return storeRepo.getAll().find((s) => s.id === id);
  },
  getByLoginId(loginId: string): Store | undefined {
    return storeRepo.getAll().find((s) => s.loginId === loginId);
  },
  getApproved(): PublicStore[] {
    return storeRepo
      .getAll()
      .filter(isStoreAvailable)
      .map(({ passwordHash: _passwordHash, ...store }) => store);
  },
  getPublicById(id: string): PublicStore | undefined {
    const store = storeRepo.getById(id);
    if (!store || !isStoreAvailable(store)) return undefined;
    const { passwordHash: _passwordHash, ...publicStore } = store;
    return publicStore;
  },
  isAvailable(id: string): boolean {
    const store = storeRepo.getById(id);
    return !!store && isStoreAvailable(store);
  },
  getPending(): Store[] {
    return storeRepo.getAll().filter((s) => s.status === "pendente");
  },
  save(store: Store) {
    const all = storeRepo.getAll();
    const idx = all.findIndex((s) => s.id === store.id);
    if (idx >= 0) all[idx] = store;
    else all.push(store);
    write(KEYS.stores, all);
  },
  update(id: string, patch: Partial<Store>) {
    const store = storeRepo.getById(id);
    if (!store) return;
    storeRepo.save({ ...store, ...patch });
  },
  remove(id: string) {
    write(KEYS.stores, storeRepo.getAll().filter((s) => s.id !== id));
  },
};

function isStoreAvailable(store: Store): boolean {
  return store.status === "ativo" && store.availabilityStatus !== "Inativo";
}

function slugify(name: string): string {
  const base = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  let slug = base || "loja";
  let n = 1;
  while (storeRepo.getById(slug)) slug = `${base}-${n++}`;
  return slug;
}

export async function registerStore(input: {
  name: string; category: string; address: string; phone: string; whatsapp: string; username: string; password: string;
}): Promise<Store> {
  const loginId = generateLoginId();
  const passwordHash = await hashPassword(input.password);
  const store: Store = {
    id: slugify(input.name),
    loginId,
    passwordHash,
    username: input.username,
    name: input.name,
    category: input.category,
    address: input.address,
    phone: input.phone,
    whatsapp: input.whatsapp,
    status: "pendente",
    preferredContact: "whatsapp",
    featured: false,
    gallery: [],
    amenities: [],
    services: [],
    professionals: [],
    establishment: { workDays: [1, 2, 3, 4, 5, 6], openTime: "09:00", closeTime: "19:00", holidays: [] },
    customization: { fontFamily: "Work Sans", fontSize: "base", primaryColor: "#2F6B6B", secondaryColor: "#EBF3F3", cardStyle: "quadrado", cardFill: "solido" },
    financeClosingDay: 0,
    createdAt: new Date().toISOString(),
  };
  storeRepo.save(store);
  return store;
}

export async function loginLojista(username: string, password: string, loginId: string): Promise<Store | null> {
  const store = storeRepo.getByLoginId(loginId);
  if (!store) return null;
  if (store.username !== username) return null;
  const hash = await hashPassword(password);
  if (hash !== store.passwordHash) return null;
  if (!isStoreAvailable(store)) return null;
  return store;
}

export const bookingRepo = {
  getAll(): Booking[] {
    return read(KEYS.bookings, []);
  },
  getByStore(storeId: string): Booking[] {
    return bookingRepo.getAll().filter((b) => b.storeId === storeId);
  },
  save(booking: Booking) {
    write(KEYS.bookings, [...bookingRepo.getAll(), booking]);
  },
  cancel(id: string) {
    write(KEYS.bookings, bookingRepo.getAll().map((b) => (b.id === id ? { ...b, status: "cancelado" as const } : b)));
  },
  isSlotTaken(
    storeId: string,
    professionalId: string,
    date: string,
    startMin: number,
    durationMin: number,
  ): boolean {
    const endMin = startMin + durationMin;
    const services = storeRepo.getById(storeId)?.services ?? [];
    return bookingRepo.getByStore(storeId).some((booking) => {
      if (booking.professionalId !== professionalId || booking.date !== date || booking.status !== "confirmado") {
        return false;
      }

      const [hours, minutes] = booking.time.split(":").map(Number);
      const existingStartMin = hours * 60 + minutes;
      const storedItemsDuration = booking.items?.reduce(
        (total, item) => total + (Number.isFinite(item.duration) ? item.duration : 0),
        0,
      );
      const existingDuration =
        booking.durationMin ??
        (storedItemsDuration && storedItemsDuration > 0 ? storedItemsDuration : undefined) ??
        services.find((service) => service.id === booking.serviceId)?.duration ??
        30;
      const existingEndMin = existingStartMin + existingDuration;

      return startMin < existingEndMin && endMin > existingStartMin;
    });
  },
};

export const ticketRepo = {
  getAll(): Ticket[] {
    return read(KEYS.tickets, []);
  },
  save(ticket: Ticket) {
    const all = ticketRepo.getAll();
    const idx = all.findIndex((t) => t.id === ticket.id);
    if (idx >= 0) all[idx] = ticket;
    else all.push(ticket);
    write(KEYS.tickets, all);
  },
  updateStatus(ticketId: string, status: Ticket["status"]) {
    const all = ticketRepo.getAll();
    const ticketIndex = all.findIndex((ticket) => ticket.id === ticketId);
    if (ticketIndex < 0) return;
    all[ticketIndex] = { ...all[ticketIndex], status };
    write(KEYS.tickets, all);
  },
  reply(ticketId: string, sender: string, text: string) {
    const all = ticketRepo.getAll();
    const ticket = all.find((t) => t.id === ticketId);
    if (!ticket) return;
    ticket.messages.push({ sender, text, time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) });
    ticket.status = "fechado";
    write(KEYS.tickets, all);
  },
};

export const storeSupportTicketRepo = {
  getAll(): StoreSupportTicket[] {
    return read<StoreSupportTicket[]>(KEYS.storeTickets, []);
  },
  getByStore(storeId: string): StoreSupportTicket[] {
    return storeSupportTicketRepo.getAll().filter((ticket) => ticket.storeId === storeId);
  },
  save(ticket: StoreSupportTicket) {
    const all = storeSupportTicketRepo.getAll();
    write(KEYS.storeTickets, [ticket, ...all]);
  },
  updateStatus(ticketId: string, status: StoreSupportTicket["status"]) {
    const all = storeSupportTicketRepo.getAll();
    const ticketIndex = all.findIndex((ticket) => ticket.id === ticketId);
    if (ticketIndex < 0) return;
    all[ticketIndex] = { ...all[ticketIndex], status };
    write(KEYS.storeTickets, all);
  },
};

export const adminRepo = {
  getGlobalMetrics() {
    const stores = storeRepo.getAll();
    const bookings = bookingRepo.getAll();
    const legacyTickets = ticketRepo.getAll();
    const storeTickets = storeSupportTicketRepo.getAll();

    const totalRevenue = bookings
      .filter(
        (booking) =>
          booking.status === "confirmado" || booking.status === "concluído",
      )
      .reduce(
        (total, booking) =>
          total + (Number.isFinite(booking.price) ? booking.price : 0),
        0,
      );

    const openTickets =
      legacyTickets.filter((ticket) => ticket.status === "aberto").length +
      storeTickets.filter((ticket) => ticket.status === "Em Aberto").length;

    return {
      totalStores: stores.length,
      activeStores: stores.filter(
        (store) => store.status === "ativo" && store.availabilityStatus !== "Inativo",
      ).length,
      totalBookings: bookings.length,
      totalRevenue,
      openTickets,
    };
  },
  toggleStoreStatus(storeId: string) {
    const store = storeRepo.getById(storeId);
    if (!store) return;
    storeRepo.update(storeId, {
      availabilityStatus: store.availabilityStatus === "Inativo" ? "Ativo" : "Inativo",
    });
  },
  updateStorePlan(storeId: string, plano: NonNullable<Store["plano"]>) {
    storeRepo.update(storeId, { plano });
  },
};

export const adminTicketRepo = {
  replyTicket(ticketId: string, reply: string) {
    const normalizedReply = reply.trim();
    if (!normalizedReply) return;
    const storeTicket = storeSupportTicketRepo
      .getAll()
      .some((ticket) => ticket.id === ticketId);
    if (storeTicket) {
      const allTickets = storeSupportTicketRepo.getAll();
      const updatedTickets = allTickets.map((ticket) =>
        ticket.id === ticketId
          ? { ...ticket, adminReply: normalizedReply, status: "Respondido" as const }
          : ticket,
      );
      write(KEYS.storeTickets, updatedTickets);
      return;
    }
    ticketRepo.reply(ticketId, "Suporte", normalizedReply);
  },
};

export const sessionRepo = {
  get(): Session | null {
    return read<Session | null>(KEYS.session, null);
  },
  set(session: Session) {
    write(KEYS.session, session);
  },
  clear() {
    localStorage.removeItem(KEYS.session);
  },
};

export function buildWhatsAppLink(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  const phoneWithCountryCode = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${phoneWithCountryCode}?text=${encodeURIComponent(message)}`;
}
