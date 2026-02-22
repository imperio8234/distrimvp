import Link from "next/link";

const PLANS = [
  {
    name: "Básico",
    price: "79.000",
    period: "/mes",
    description: "Para distribuidoras pequeñas",
    highlight: false,
    features: [
      "3 vendedores",
      "2 repartidores",
      "Hasta 200 clientes",
      "Mapa y rutas GPS",
      "Gestión de pedidos",
      "App móvil",
      "90 días de historial",
    ],
    missing: ["Reportes avanzados", "API REST"],
    cta: "Empezar prueba",
    href: "/register",
  },
  {
    name: "Profesional",
    price: "199.000",
    period: "/mes",
    description: "El más popular para medianas distribuidoras",
    highlight: true,
    badge: "⭐ Más popular",
    features: [
      "10 vendedores",
      "5 repartidores",
      "Hasta 1.000 clientes",
      "Mapa y rutas GPS",
      "Gestión de pedidos",
      "App móvil",
      "Reportes avanzados",
      "1 año de historial",
    ],
    missing: ["API REST"],
    cta: "Empezar prueba",
    href: "/register",
  },
  {
    name: "Empresarial",
    price: "499.000",
    period: "/mes",
    description: "Sin límites, con soporte prioritario",
    highlight: false,
    features: [
      "Vendedores ilimitados",
      "Repartidores ilimitados",
      "Clientes ilimitados",
      "Mapa y rutas GPS",
      "Gestión de pedidos",
      "App móvil",
      "Reportes avanzados",
      "Historial ilimitado",
      "API REST",
      "Soporte prioritario",
    ],
    missing: [],
    cta: "Contactar",
    href: "/register",
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 md:py-28 bg-white">
      <div className="max-w-5xl mx-auto px-5">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-6">
          <span className="text-brand-600 font-semibold text-sm uppercase tracking-wider">
            Precios
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mt-2 mb-4">
            Planes en pesos colombianos
          </h2>
        </div>

        {/* Banner de prueba */}
        <div className="bg-gradient-to-r from-brand-800 to-blue-700 rounded-2xl p-5 mb-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
              🎁
            </div>
            <div>
              <p className="text-white font-bold text-lg">14 días de prueba gratis</p>
              <p className="text-blue-100 text-sm">
                Todas las empresas nuevas reciben acceso completo al plan <strong>Profesional</strong> por 14 días. Sin tarjeta de crédito.
              </p>
            </div>
          </div>
          <Link
            href="/register"
            className="flex-shrink-0 bg-white text-brand-800 font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-blue-50 transition-colors whitespace-nowrap"
          >
            Empieza gratis →
          </Link>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-6 flex flex-col ${
                plan.highlight
                  ? "border-brand-800 bg-brand-800 text-white shadow-xl scale-[1.03]"
                  : "border-gray-200 bg-white text-gray-900"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                  {plan.badge}
                </div>
              )}

              <div className="mb-4">
                <p className={`text-sm font-semibold mb-1 ${plan.highlight ? "text-blue-200" : "text-gray-500"}`}>
                  {plan.name}
                </p>
                <div className="flex items-end gap-1 mb-1">
                  <span className={`text-xs ${plan.highlight ? "text-blue-200" : "text-gray-400"}`}>COP $</span>
                  <span className="text-3xl font-black">{plan.price}</span>
                  <span className={`text-xs mb-1 ${plan.highlight ? "text-blue-200" : "text-gray-400"}`}>
                    {plan.period}
                  </span>
                </div>
                <p className={`text-xs ${plan.highlight ? "text-blue-200" : "text-gray-500"}`}>
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-2 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs">
                    <span className={`mt-0.5 flex-shrink-0 ${plan.highlight ? "text-green-300" : "text-green-500"}`}>
                      ✓
                    </span>
                    <span className={plan.highlight ? "text-blue-100" : "text-gray-600"}>{f}</span>
                  </li>
                ))}
                {plan.missing.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs opacity-40">
                    <span className="mt-0.5 flex-shrink-0">✕</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`block text-center font-bold py-3 rounded-xl text-sm transition-all ${
                  plan.highlight
                    ? "bg-white text-brand-800 hover:bg-blue-50"
                    : "bg-brand-800 text-white hover:bg-brand-700"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-400 text-sm mt-8">
          Al terminar los 14 días, elige el plan que mejor se adapte a tu distribuidora.{" "}
          <a href="mailto:hola@distriapp.co" className="text-brand-700 hover:underline font-medium">
            ¿Tienes dudas? Escríbenos.
          </a>
        </p>
      </div>
    </section>
  );
}
