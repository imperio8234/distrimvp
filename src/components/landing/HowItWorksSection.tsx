const STEPS = [
  {
    number: "01",
    title: "Registra tu distribuidora",
    description:
      "Crea tu cuenta en minutos. Ingresa el nombre de tu empresa y listo. Tienes 14 días gratis sin restricciones.",
    icon: "🏢",
  },
  {
    number: "02",
    title: "Agrega tu equipo y clientes",
    description:
      "Crea usuarios para tus vendedores y repartidores. Importa o agrega tus clientes con su ubicación GPS.",
    icon: "👥",
  },
  {
    number: "03",
    title: "Tu equipo trabaja desde la app",
    description:
      "Vendedores y repartidores descargan la app en su celular. Desde ese momento tienes visibilidad total de tu operación.",
    icon: "📱",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how" className="py-20 md:py-28 bg-gray-50">
      <div className="max-w-6xl mx-auto px-5">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-brand-600 font-semibold text-sm uppercase tracking-wider">
            Cómo funciona
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mt-2 mb-4">
            Empieza a operar en menos de una hora
          </h2>
          <p className="text-gray-500 text-lg">
            Sin capacitaciones largas, sin migraciones complicadas.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Línea conectora (desktop) */}
          <div className="hidden md:block absolute top-10 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-brand-200 to-brand-200 -z-0" />

          {STEPS.map((step, i) => (
            <div key={step.number} className="relative text-center">
              {/* Número */}
              <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-brand-800 text-white mb-6 mx-auto shadow-lg">
                <span className="text-3xl">{step.icon}</span>
                <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-blue-400 text-white text-xs font-black flex items-center justify-center">
                  {i + 1}
                </span>
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-3">{step.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
