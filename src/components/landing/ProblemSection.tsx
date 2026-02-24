import Link from "next/link";

const SCENARIOS = [
  {
    icon: "🏖️",
    title: "Vendedor en vacaciones, clientes sin visita",
    story:
      "Tu vendedor se fue 2 semanas. Sus 60 clientes no recibieron ni una llamada. Cuando volvió, 10 ya le estaban comprando a la competencia.",
    cost: "Hasta $6M COP en ventas perdidas por rotación",
    color: "border-orange-200 bg-orange-50",
    iconBg: "bg-orange-100",
  },
  {
    icon: "👋",
    title: "Vendedor renuncia, cartera sin dueño",
    story:
      "Renunció sin aviso. Su cartera de 80 clientes quedó huérfana 3 semanas mientras conseguías remplazo. La mitad no esperó.",
    cost: "Semanas de inactividad sin visibilidad",
    color: "border-red-200 bg-red-50",
    iconBg: "bg-red-100",
  },
  {
    icon: "🤷",
    title: "No sabes qué está pasando en la calle",
    story:
      "El vendedor dice que visitó al cliente. El cliente dice que nadie apareció. Sin registro de visitas, sin GPS, sin evidencia — no puedes saber quién tiene razón.",
    cost: "Decisiones a ciegas, sin datos reales",
    color: "border-yellow-200 bg-yellow-50",
    iconBg: "bg-yellow-100",
  },
];

export function ProblemSection() {
  return (
    <section id="problem" className="py-20 md:py-28 bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-5">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-red-400 font-semibold text-sm uppercase tracking-wider">
            El problema real
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-white mt-2 mb-4">
            ¿Te suena familiar?
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            Esto nos lo contó el dueño de un minimercado: <em className="text-gray-300">"El
            distribuidor dejó de visitarme por meses. Pensé que ya no vendían lo que yo necesitaba.
            Empecé a pedir en otro lado."</em>
            <br />
            <span className="text-gray-500 text-sm mt-2 block">
              — El distribuidor nunca supo que lo perdió hasta que fue demasiado tarde.
            </span>
          </p>
        </div>

        {/* Escenarios */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          {SCENARIOS.map((s) => (
            <div
              key={s.title}
              className={`rounded-2xl border p-6 ${s.color}`}
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl text-2xl ${s.iconBg} mb-4`}>
                {s.icon}
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">{s.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">{s.story}</p>
              <p className="text-xs font-semibold text-gray-500 border-t border-gray-200 pt-3">
                📉 {s.cost}
              </p>
            </div>
          ))}
        </div>

        {/* Solución */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 md:p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="text-green-400 font-semibold text-sm uppercase tracking-wider">
                La solución
              </span>
              <h3 className="text-2xl md:text-3xl font-black text-white mt-2 mb-4">
                Visibilidad total antes de que el cliente se vaya
              </h3>
              <ul className="space-y-3 text-gray-300 text-sm">
                {[
                  "Alerta automática cuando un cliente lleva +7 días sin visita",
                  "Reasigna la cartera de un vendedor en 2 clics, desde el celular o el PC",
                  "Historial de visitas por cliente: quién fue, cuándo, qué resultado",
                  "GPS y check-in/check-out: sabe si el vendedor realmente estuvo allí",
                  "Semáforo de temperatura: CALIENTE → TIBIO → FRÍO → CONGELADO",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="text-green-400 font-bold shrink-0 mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Mockup de alerta */}
            <div className="space-y-3">
              {[
                { name: "Tienda La Esquina", days: 18, status: "CONGELADO", color: "bg-red-500" },
                { name: "Minimarket Don Luis", days: 12, status: "CONGELADO", color: "bg-red-500" },
                { name: "Supermercado El Barrio", days: 8, status: "FRÍO", color: "bg-orange-500" },
                { name: "Tienda Doña Rosa", days: 5, status: "TIBIO", color: "bg-yellow-500" },
              ].map((c) => (
                <div
                  key={c.name}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3"
                >
                  <div className={`w-2.5 h-2.5 rounded-full ${c.color} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{c.name}</p>
                    <p className="text-xs text-gray-400">Sin visita hace {c.days} días</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    c.color === "bg-red-500" ? "bg-red-500/20 text-red-400" :
                    c.color === "bg-orange-500" ? "bg-orange-500/20 text-orange-400" :
                    "bg-yellow-500/20 text-yellow-400"
                  }`}>
                    {c.status}
                  </span>
                </div>
              ))}
              <p className="text-xs text-gray-500 text-center pt-1">
                Estos clientes necesitan visita urgente
              </p>
            </div>
          </div>
        </div>

        {/* CTA inline */}
        <div className="text-center mt-10">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold px-8 py-4 rounded-xl text-base hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            Empieza a proteger tu cartera — gratis 14 días →
          </Link>
        </div>
      </div>
    </section>
  );
}
