import Link from "next/link";

const APP_FEATURES = [
  { icon: "📍", text: "Mapa con todos tus clientes asignados" },
  { icon: "✅", text: "Check-in y check-out en cada visita" },
  { icon: "🛒", text: "Toma de pedidos directamente desde el cliente" },
  { icon: "🧭", text: "Navegación a Google Maps con un toque" },
  { icon: "📋", text: "Historial de visitas por cliente" },
  { icon: "🚚", text: "Ruta del día para repartidores" },
];

export function AppSection() {
  return (
    <section id="app" className="py-20 md:py-28 bg-brand-900">
      <div className="max-w-6xl mx-auto px-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Texto */}
          <div>
            <span className="text-blue-300 font-semibold text-sm uppercase tracking-wider">
              App móvil
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white mt-2 mb-4">
              Tu equipo siempre conectado,
              <br />
              <span className="text-blue-300">desde el celular</span>
            </h2>
            <p className="text-blue-100 text-lg mb-8 leading-relaxed">
              Vendedores y repartidores trabajan desde una app sencilla en su celular Android o iPhone. Sin capacitación larga — en 5 minutos están operando.
            </p>

            <ul className="space-y-3 mb-10">
              {APP_FEATURES.map((f) => (
                <li key={f.text} className="flex items-center gap-3 text-blue-100">
                  <span className="text-xl flex-shrink-0">{f.icon}</span>
                  <span className="text-sm">{f.text}</span>
                </li>
              ))}
            </ul>

            {/* Descarga / acceso */}
            <div className="bg-white/10 border border-white/20 rounded-2xl p-5">
              <p className="text-white font-bold mb-1">¿Cómo accede mi equipo?</p>
              <p className="text-blue-200 text-sm mb-4">
                La app se instala directamente en el celular. Comparte el enlace de instalación con tus vendedores y repartidores — sin necesidad de Play Store.
              </p>
              <Link
                href="/app/install"
                className="inline-flex items-center gap-2 bg-white text-brand-800 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-blue-50 transition-colors"
              >
                📲 Descargar app para el equipo
              </Link>
            </div>
          </div>

          {/* Mockup del teléfono */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              {/* Teléfono */}
              <div className="w-64 bg-gray-900 rounded-[2.5rem] p-2 shadow-2xl border border-white/10">
                <div className="bg-gray-800 rounded-[2rem] overflow-hidden">
                  {/* Notch */}
                  <div className="bg-gray-900 h-7 flex items-center justify-center">
                    <div className="w-20 h-4 bg-gray-800 rounded-full" />
                  </div>

                  {/* Pantalla de mapa (mockup) */}
                  <div className="h-96 bg-gradient-to-b from-green-900 to-green-800 relative overflow-hidden">
                    {/* Fondo del mapa */}
                    <div className="absolute inset-0 grid grid-cols-6 grid-rows-8 gap-px opacity-20">
                      {Array.from({ length: 48 }).map((_, i) => (
                        <div key={i} className="bg-green-600" />
                      ))}
                    </div>

                    {/* Header app */}
                    <div className="relative z-10 bg-brand-800 px-3 py-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-white text-xs font-bold">DistriApp</span>
                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                          <span className="text-white text-xs">JL</span>
                        </div>
                      </div>
                    </div>

                    {/* Pins en el mapa */}
                    {[
                      { top: "30%", left: "25%", hot: true },
                      { top: "45%", left: "55%", hot: false },
                      { top: "60%", left: "35%", hot: false },
                      { top: "35%", left: "70%", hot: true },
                      { top: "70%", left: "65%", hot: false },
                    ].map((pin, i) => (
                      <div
                        key={i}
                        className="absolute z-10"
                        style={{ top: pin.top, left: pin.left }}
                      >
                        <div
                          className={`w-5 h-5 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold ${
                            pin.hot ? "bg-green-500" : "bg-orange-500"
                          }`}
                        >
                          {i + 1}
                        </div>
                      </div>
                    ))}

                    {/* Mi ubicación */}
                    <div className="absolute z-10" style={{ top: "50%", left: "50%" }}>
                      <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg" />
                      <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-50" />
                    </div>

                    {/* Bottom card */}
                    <div className="absolute bottom-0 inset-x-0 bg-white/95 rounded-t-xl p-3 z-10">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="h-2 bg-gray-300 rounded w-24 mb-1" />
                          <div className="h-2 bg-gray-200 rounded w-16" />
                        </div>
                        <div className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
                          HOT
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1 h-7 bg-brand-800 rounded-lg" />
                        <div className="h-7 w-12 bg-gray-100 rounded-lg" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Badges flotantes */}
              <div className="absolute -left-8 top-16 bg-white rounded-xl shadow-xl px-3 py-2 text-xs font-bold text-gray-800 whitespace-nowrap">
                🟢 8 clientes hoy
              </div>
              <div className="absolute -right-6 bottom-20 bg-green-500 rounded-xl shadow-xl px-3 py-2 text-xs font-bold text-white whitespace-nowrap">
                ✓ Pedido tomado
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
