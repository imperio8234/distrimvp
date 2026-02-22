const FEATURES = [
  {
    icon: "🗺️",
    title: "Mapa de clientes en tiempo real",
    description:
      "Visualiza todos tus clientes en el mapa con indicadores de temperatura (caliente, tibio, frío, congelado) según la última visita. El vendedor ve su ruta directo en Google Maps.",
    color: "bg-blue-50 text-blue-700 border-blue-100",
  },
  {
    icon: "📱",
    title: "App móvil para el equipo",
    description:
      "Vendedores toman pedidos, hacen check-in en el cliente y registran visitas desde su celular. Los repartidores ven su ruta del día y confirman entregas con un toque.",
    color: "bg-green-50 text-green-700 border-green-100",
  },
  {
    icon: "📦",
    title: "Gestión completa de pedidos",
    description:
      "Desde que el vendedor toma el pedido hasta que el repartidor lo entrega. Seguimiento en tiempo real del estado de cada orden.",
    color: "bg-orange-50 text-orange-700 border-orange-100",
  },
  {
    icon: "🧭",
    title: "Rutas optimizadas",
    description:
      "El vendedor arma su ruta seleccionando clientes en orden y la abre directamente en Google Maps con todos los waypoints. Sin hojas de papel.",
    color: "bg-purple-50 text-purple-700 border-purple-100",
  },
  {
    icon: "📊",
    title: "Panel de control para el dueño",
    description:
      "Dashboard con semáforo de clientes, ingresos del mes, pedidos pendientes y visitas del día. Sabe qué pasa en tu negocio sin llamar a cada vendedor.",
    color: "bg-brand-50 text-brand-700 border-brand-100",
  },
  // DIAN: pendiente de implementación — oculto hasta activar
  // {
  //   icon: "🧾",
  //   title: "Facturación electrónica DIAN",
  //   description:
  //     "Integración con la DIAN para emisión de facturas electrónicas. Disponible en planes Profesional y Empresarial. Resolución, prefijos y rangos configurados por nosotros.",
  //   color: "bg-gray-50 text-gray-700 border-gray-200",
  // },
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
            Todo lo que tu distribuidora necesita
          </h2>
          <p className="text-gray-500 text-lg">
            Sin complicaciones. Sin instalar nada en el servidor. Listo en minutos.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div
                className={`inline-flex items-center justify-center w-12 h-12 rounded-xl text-2xl border ${f.color} mb-4`}
              >
                {f.icon}
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
