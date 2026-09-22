import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { storeRepo, sessionRepo, type Store } from "../lib/db";

const FALLBACK_IMAGE = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="520" viewBox="0 0 800 520">
  <rect width="800" height="520" fill="#EBF3F3" />
  <circle cx="400" cy="260" r="150" fill="#2F6B6B" opacity="0.12" />
  <text x="400" y="270" font-size="28" text-anchor="middle" fill="#234F4F" font-family="Arial, sans-serif">iService</text>
</svg>
`)}`;

function StoreCard({ store, onClick }: { store: Store; onClick: () => void }) {
  const gallery = store.gallery.length > 0 ? store.gallery : [FALLBACK_IMAGE];
  const [imageIndex, setImageIndex] = useState(0);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const startCycle = () => {
    if (gallery.length < 2) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => setImageIndex(i => (i + 1) % gallery.length), 900);
  };
  const stopCycle = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = undefined;
    setImageIndex(0);
  };

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all cursor-pointer shrink-0 w-72 group"
      onClick={onClick}
      onMouseEnter={startCycle}
      onMouseLeave={stopCycle}
    >
      <div className="relative h-44 overflow-hidden">
        <img src={gallery[imageIndex]} alt={store.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }} />
        {gallery.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {gallery.map((_, i) => <span key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === imageIndex ? "bg-white" : "bg-white/40"}`} />)}
          </div>
        )}
        {store.featured && <div className="absolute top-3 left-3 bg-[#2F6B6B] text-white text-xs px-2 py-1 rounded-full font-medium">⭐ Destaque</div>}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1">{store.name}</h3>
        <p className="text-xs text-[#2F6B6B] font-medium mb-3">{store.category}</p>
        <div className="flex flex-wrap gap-1">
          {store.amenities.slice(0, 3).map(b => <span key={b} className="text-xs bg-gray-50 border border-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{b}</span>)}
        </div>
      </div>
    </div>
  );
}

function CTACard() {
  const navigate = useNavigate();
  return (
    <div className="bg-[#EBF3F3] border-2 border-dashed border-[#2F6B6B]/30 rounded-2xl shrink-0 w-72 h-64 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-[#2F6B6B]/10 transition-colors"
      onClick={() => navigate("/login?mode=lojista")}>
      <div className="w-14 h-14 rounded-full bg-[#2F6B6B]/10 flex items-center justify-center">
        <svg className="w-7 h-7 text-[#2F6B6B]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
      </div>
      <div className="text-center px-4">
        <p className="font-semibold text-[#2F6B6B] text-sm">Anuncie sua loja aqui também</p>
        <p className="text-xs text-gray-500 mt-1">Alcance milhares de clientes na sua região</p>
      </div>
    </div>
  );
}

function HorizontalScroll({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * 300, behavior: "smooth" });
  return (
    <div className="relative">
      <button type="button" onClick={() => scroll(-1)} className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-9 h-9 bg-white shadow-md border border-gray-100 rounded-full items-center justify-center hover:bg-gray-50 transition-colors">
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
      </button>
      <div ref={ref} className="flex gap-4 overflow-x-auto pb-2 scroll-smooth" style={{ scrollbarWidth: "none" }}>{children}</div>
      <button type="button" onClick={() => scroll(1)} className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-9 h-9 bg-white shadow-md border border-gray-100 rounded-full items-center justify-center hover:bg-gray-50 transition-colors">
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
      </button>
    </div>
  );
}

type GeoState = "pending" | "granted" | "denied";

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [stores, setStores] = useState<Store[]>([]);
  const [geo, setGeo] = useState<GeoState>("pending");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const session = sessionRepo.get();

  useEffect(() => {
    setStores(storeRepo.getApproved());
    const categoryFromQuery = searchParams.get("categoria");
    if (categoryFromQuery) setSearch(categoryFromQuery);

    if (!("geolocation" in navigator)) { setGeo("denied"); return; }
    navigator.geolocation.getCurrentPosition(() => setGeo("granted"), () => setGeo("denied"), { timeout: 5000 });
  }, [searchParams]);

  const featured = stores.filter(s => s.featured);
  const categoriesPresent = useMemo(() => Array.from(new Set(stores.map(s => s.category))), [stores]);
  const q = search.trim().toLowerCase();
  const searching = q.length > 0;
  const searchResults = searching ? stores.filter(s => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)) : [];

  const handleSearch = (e: React.FormEvent) => e.preventDefault();

  return (
    <div className="min-h-screen flex flex-col">
      <Header loggedIn={!!session} userName={session?.name} />

      <section className="bg-[#1a2e2e] py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight" style={{ fontFamily: "var(--font-display)" }}>
            Beleza e bem-estar<br /><span style={{ color: "#7BBDBD" }}>ao seu alcance</span>
          </h1>
          <p className="text-gray-300 text-lg mb-10 max-w-xl mx-auto">Encontre e agende os melhores serviços da sua cidade em segundos.</p>
          <form onSubmit={handleSearch} className="max-w-xl mx-auto">
            <div className="flex bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="flex items-center pl-4">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar serviço, estabelecimento ou categoria…"
                className="flex-1 px-4 py-4 text-gray-800 text-sm outline-none bg-transparent" />
              <button type="submit" className="m-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-colors shrink-0" style={{ background: "#2F6B6B" }}>Buscar</button>
            </div>
          </form>
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {categoriesPresent.slice(0, 6).map(c => (
              <button key={c} onClick={() => setSearch(c)} className="text-xs font-medium text-gray-300 border border-white/20 rounded-full px-3 py-1.5 hover:bg-white/10 transition-colors">{c}</button>
            ))}
          </div>
        </div>
      </section>

      {searching ? (
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>Resultados para "{search}"</h2>
            <button onClick={() => setSearch("")} className="text-sm text-[#2F6B6B] font-medium hover:underline">Limpar busca</button>
          </div>
          {searchResults.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhum estabelecimento encontrado.</p>
          ) : (
            <div className="flex flex-wrap gap-4">
              {searchResults.map(s => <StoreCard key={s.id} store={s} onClick={() => navigate(`/booking/${s.id}`)} />)}
            </div>
          )}
        </section>
      ) : (
        <>
          <section id="destaques" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>Destaques</h2>
            </div>
            {featured.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhum estabelecimento em destaque no momento.</p>
            ) : (
              <HorizontalScroll>{featured.map(s => <StoreCard key={s.id} store={s} onClick={() => navigate(`/booking/${s.id}`)} />)}</HorizontalScroll>
            )}
          </section>

          <p className="text-xs text-gray-400 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full -mt-4 mb-2">
            {geo === "granted" && "📍 Mostrando com base na sua localização"}
            {geo === "denied" && "Mostrando os mais populares da plataforma (localização não disponível)"}
            {geo === "pending" && "Buscando sua localização…"}
          </p>

          {categoriesPresent.length === 0 && <p className="text-center text-sm text-gray-400 py-16">Ainda não há estabelecimentos cadastrados.</p>}

          {categoriesPresent.map((cat, idx) => {
            const catStores = stores.filter(s => s.category === cat);
            const isLast = idx === categoriesPresent.length - 1;
            return (
              <section key={cat} id="categorias" className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-gray-50">
                <div className="flex items-baseline justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>
                    {cat} <span className="text-gray-400 text-lg font-normal">— perto de você</span>
                  </h2>
                </div>
                <HorizontalScroll>
                  {catStores.map(s => <StoreCard key={s.id} store={s} onClick={() => navigate(`/booking/${s.id}`)} />)}
                  {isLast && <CTACard />}
                </HorizontalScroll>
              </section>
            );
          })}
        </>
      )}

      <Footer />
    </div>
  );
}
