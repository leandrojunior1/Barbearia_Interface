import { storeRepo, generateLoginId, type Store } from "./db";

// Hash fixo de "demo123" (SHA-256), pré-calculado para não depender de
// crypto.subtle de forma assíncrona no carregamento inicial.
const DEMO_PASSWORD_HASH = "d3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791";

export function seedIfEmpty() {
  if (storeRepo.getAll().length > 0) return;

  const barbearia: Store = {
    id: "barbearia-do-joao",
    loginId: generateLoginId(),
    passwordHash: DEMO_PASSWORD_HASH,
    username: "joao",
    name: "Barbearia do João",
    category: "Barbearia",
    address: "Av. Paulista, 1234, São Paulo",
    phone: "11999990000",
    whatsapp: "11999990000",
    status: "ativo",
    preferredContact: "whatsapp",
    featured: true,
    gallery: [
      "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&h=500&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=260&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&h=260&fit=crop&auto=format",
    ],
    amenities: ["Café", "Estacionamento", "Wi-Fi"],
    services: [
      { id: "s1", name: "Corte de Cabelo", duration: 45, price: 45 },
      { id: "s2", name: "Barba Completa", duration: 30, price: 35 },
      { id: "s3", name: "Corte + Barba", duration: 75, price: 70 },
    ],
    professionals: [
      {
        id: "p1", name: "Carlos Silva", role: "Especialista em cortes clássicos",
        photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&auto=format",
        serviceIds: ["s1", "s2", "s3"],
        workDays: [1, 2, 3, 4, 5, 6], workStart: "09:00", workEnd: "18:00", breakStart: "12:00", breakEnd: "13:00",
      },
      {
        id: "p2", name: "Marcos Oliveira", role: "Especialista em barba e estilo",
        photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&auto=format",
        serviceIds: ["s2"],
        workDays: [2, 3, 4, 5, 6], workStart: "10:00", workEnd: "19:00", breakStart: "13:00", breakEnd: "14:00",
      },
    ],
    establishment: { workDays: [1, 2, 3, 4, 5, 6], openTime: "09:00", closeTime: "19:00", holidays: [] },
    customization: { fontFamily: "Work Sans", fontSize: "base", primaryColor: "#2F6B6B", secondaryColor: "#EBF3F3", cardStyle: "quadrado", cardFill: "solido" },
    financeClosingDay: 0,
    createdAt: new Date().toISOString(),
  };

  storeRepo.save(barbearia);
}
