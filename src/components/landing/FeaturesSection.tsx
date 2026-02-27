const FEATURES = [
  {
    icon: "🚨",
    title: "Alertas de clientes sin visitar",
    description:
      "Semáforo automático: CALIENTE (≤3 días), TIBIO (≤7), FRÍO (≤14), CONGELADO (+14). Sabe en 3 segundos qué clientes están en riesgo de irse con la competencia.",
    color: "bg-red-50 text-red-700 border-red-100",
    tag: "Retención de clientes",
  },
  {
    icon: "🔄",
    title: "Reasignación de cartera en 2 clics",
    description:
      "Vendedor de vacaciones, renuncia o incapacidad. Reasigna su cartera completa a otro vendedor desde el panel web. Los clientes no se quedan sin atender ni un día más.",
    color: "bg-orange-50 text-orange-700 border-orange-100",
    tag: "Continuidad de la operación",
  },
  {
    icon: "📋",
    title: "Historial de visitas por cliente",
    description:
      "Cada visita queda registrada: quién fue, cuándo, resultado, monto del pedido y notas. Si el cliente dice que nadie lo visitó, tienes los datos para verificarlo.",
    color: "bg-blue-50 text-blue-700 border-blue-100",
    tag: "Trazabilidad total",
  },
  {
    icon: "📍",
    title: "GPS y check-in en el cliente",
    description:
      "El vendedor registra su llegada y salida con GPS. Sabes exactamente a qué hora estuvo en cada tienda y desde dónde envió el pedido. Sin hojas de papel.",
    color: "bg-green-50 text-green-700 border-green-100",
    tag: "Verificación en campo",
  },
  {
    icon: "🗺️",
    title: "Rutas y asignación por radio",
    description:
      "Selecciona clientes en el mapa por radio de distancia y asígnalos masivamente a un vendedor. El vendedor arma su ruta en la app y navega a cada cliente con Google Maps.",
    color: "bg-purple-50 text-purple-700 border-purple-100",
    tag: "Eficiencia en rutas",
  },
  {
    icon: "📊",
    title: "Dashboard de rendimiento del equipo",
    description:
      "Ranking de vendedores por visitas, órdenes y monto. Gráficas de tendencia. Configura una meta semanal y ve en tiempo real si el equipo la está cumpliendo.",
    color: "bg-brand-50 text-brand-700 border-brand-100",
    tag: "Control del dueño",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-5">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-brand-600 font-semibold text-sm uppercase tracking-wider">
            Características
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mt-2 mb-4">
            Herramientas para no perder ni un cliente más
          </h2>
          <p className="text-gray-500 text-lg">
            Cada función fue diseñada para resolver un problema real de las distribuidoras.
            Sin funcionalidades de relleno.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`inline-flex items-center justify-center w-12 h-12 rounded-xl text-2xl border ${f.color}`}
                >
                  {f.icon}
                </div>
                <span className="text-xs font-medium text-gray-400 bg-gray-50 border border-gray-100 px-2 py-1 rounded-full">
                  {f.tag}
                </span>
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
