import { useEffect, useState } from "react"

import { useNavigate } from "react-router"

import Header from "../components/Header"

import Footer from "../components/Footer"

import { bookingRepo, storeRepo, sessionRepo, type Booking } from "../lib/db"

export default function ClientProfilePage() {
  const navigate = useNavigate()

  const [session] = useState(() => sessionRepo.get())

  const [bookings, setBookings] = useState<Booking[]>([])

  const [cancelModalId, setCancelModalId] = useState<string | null>(null)

  useEffect(() => {
    if (!session || session.type !== "client") {
      navigate("/login")

      return
    }

    loadBookings()
  }, [navigate, session])

  const loadBookings = () => {
    if (!session?.name) return

    const normalizePhone = (phone: string) => phone.replace(/\D/g, "")

    const all = bookingRepo.getAll()

    const mine = all.filter(
      (booking) =>
        booking.clientName.trim().toLowerCase() ===
          session.name.trim().toLowerCase() ||
        (!!session.phone &&
          normalizePhone(booking.clientPhone) ===
            normalizePhone(session.phone)),
    )

    setBookings(mine)
  }

  const handleCancelBooking = (id: string) => {
    const booking = bookingRepo.getAll().find((item) => item.id === id)

    if (booking?.status === "confirmado") {
      bookingRepo.cancel(id)

      loadBookings()
    }

    setCancelModalId(null)
  }

  if (!session || session.type !== "client") return null

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-10 w-full">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8 shadow-sm flex items-center justify-between gap-4">
          <div>
            <h1
              className="text-2xl font-bold text-gray-900"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Meus Agendamentos
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Olá,{" "}
              <span className="font-semibold text-gray-800">
                {session.name}
              </span>{" "}
              ({session.phone || "Sem telefone"})
            </p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 text-sm font-medium text-white rounded-xl transition-colors shadow-sm shrink-0"
            style={{ background: "#2F6B6B" }}
          >
            Novo Agendamento
          </button>
        </div>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-[#EBF3F3] flex items-center justify-center mx-auto mb-4 text-[#2F6B6B]">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Nenhum agendamento encontrado
            </h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
              Você ainda não realizou nenhum agendamento na plataforma. Explore
              os estabelecimentos disponíveis.
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-3 text-sm font-semibold text-white rounded-xl transition-colors"
              style={{ background: "#2F6B6B" }}
            >
              Buscar Serviços
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const store = storeRepo.getById(booking.storeId)

              const service = store?.services.find(
                (item) => item.id === booking.serviceId,
              )
              const serviceNames =
                booking.items?.map((item) => item.name).join(", ") ||
                service?.name ||
                "Serviço"

              const professional = store?.professionals.find(
                (item) => item.id === booking.professionalId,
              )

              const statusColor =
                booking.status === "confirmado"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-red-50 text-red-700 border-red-200"

              return (
                <div
                  key={booking.id}
                  className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium border uppercase tracking-wider ${statusColor}`}
                      >
                        {booking.status}
                      </span>
                      <span className="text-xs text-gray-400">
                        ID: {booking.id.slice(0, 8)}
                      </span>
                    </div>
                    <h3
                      className="font-bold text-gray-900 text-lg"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {store?.name || "Estabelecimento"}
                    </h3>
                    <p className="text-sm font-medium text-gray-700">
                      {serviceNames} com{" "}
                      <span className="text-[#2F6B6B]">
                        {professional?.name || "Profissional"}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500">
                      📅 {booking.date} às {booking.time} · 💰 R${" "}
                      {Number.isFinite(booking.price) ? booking.price.toFixed(2) : "—"}
                    </p>
                  </div>

                  {booking.status === "confirmado" && (
                    <button
                      onClick={() => setCancelModalId(booking.id)}
                      className="px-4 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors self-end sm:self-center"
                    >
                      Cancelar Agendamento
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>

      {cancelModalId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-booking-title"
            className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl animate-in fade-in zoom-in-95"
          >
            <h3
              id="cancel-booking-title"
              className="text-lg font-bold text-gray-900 mb-2"
            >
              Cancelar agendamento?
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Tem certeza de que deseja cancelar este compromisso? Esta ação não
              poderá ser desfeita facilmente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelModalId(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={() => handleCancelBooking(cancelModalId)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
              >
                Sim, cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
