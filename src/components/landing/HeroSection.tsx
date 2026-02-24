import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-blue-900 pt-32 pb-20 md:pt-40 md:pb-28">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-300 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
      </div>

      <div className="relative max-w-6xl mx-auto px-5">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            <span className="text-white/90 text-xs font-semibold tracking-wide">
              El problema #1 de las distribuidoras: clientes perdidos sin aviso
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
            Deja de perder clientes{" "}
            <span className="text-blue-300">cuando un vendedor no aparece</span>
          </h1>

          <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-2xl leading-relaxed">
            DistriApp te avisa qué tiendas llevan días sin visita, qué vendedores
            están fallando su ruta y te permite reasignar carteras completas en
            segundos — antes de que el cliente le compre a la competencia.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4">
            <Link
              href="/register"
              className="bg-white text-brand-800 font-bold px-8 py-4 rounded-xl text-base hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Empieza gratis — 14 días
            </Link>
            <a
              href="#problem"
              className="border border-white/30 text-white font-semibold px-8 py-4 rounded-xl text-base hover:bg-white/10 transition-all"
            >
              ¿Te suena familiar?
            </a>
          </div>

          <p className="mt-4 text-blue-200/70 text-sm">
            Sin tarjeta de crédito · Cancela cuando quieras
          </p>
        </div>

        {/* Dashboard mockup */}
        <div className="mt-16 relative">
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            {/* Barra de título falsa */}
            <div className="bg-white/10 px-4 py-3 flex items-center gap-2 border-b border-white/10">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400 opacity-70" />
                <div className="w-3 h-3 rounded-full bg-yellow-400 opacity-70" />
                <div className="w-3 h-3 rounded-full bg-green-400 opacity-70" />
              </div>
              <div className="flex-1 bg-white/10 rounded h-5 mx-4 max-w-xs" />
            </div>

            {/* Contenido del mockup */}
            <div className="flex">
              {/* Sidebar falso */}
              <div className="w-44 bg-brand-900 p-4 space-y-2 hidden md:block">
                <div className="h-4 bg-white/20 rounded w-24 mb-6" />
                {["Panel", "Clientes", "Vendedores", "Entregas", "Rendimiento"].map((item, i) => (
                  <div
                    key={item}
                    className={`h-8 rounded-lg flex items-center px-3 gap-2 ${
                      i === 0 ? "bg-white/20" : ""
                    }`}
                  >
                    <div className={`w-3 h-3 rounded ${i === 0 ? "bg-white/60" : "bg-white/20"}`} />
                    <div className={`h-2.5 rounded flex-1 ${i === 0 ? "bg-white/60" : "bg-white/20"}`} style={{ maxWidth: `${60 + i * 10}px` }} />
                  </div>
                ))}
              </div>

              {/* Contenido principal falso */}
              <div className="flex-1 p-5 space-y-4">
                {/* Alerta de clientes sin visita */}
                <div className="bg-red-500/20 border border-red-400/30 rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse shrink-0" />
                  <div className="h-2.5 bg-red-300/50 rounded w-64" />
                  <div className="ml-auto h-6 bg-red-400/30 rounded w-20" />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "Clientes FROZEN", value: "12", color: "bg-red-500" },
                    { label: "Sin visita +7 días", value: "31", color: "bg-orange-500" },
                    { label: "Visitas hoy", value: "8", color: "bg-green-500" },
                    { label: "Ingresos del mes", value: "$12.4M", color: "bg-brand-600" },
                  ].map((s) => (
                    <div key={s.label} className="bg-white/10 rounded-xl p-3">
                      <div className={`w-6 h-1 ${s.color} rounded mb-2`} />
                      <div className="text-white font-bold text-lg">{s.value}</div>
                      <div className="text-white/50 text-xs mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Tabla falsa — clientes en riesgo */}
                <div className="bg-white/10 rounded-xl overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-white/10 flex items-center justify-between">
                    <div className="h-3 bg-white/40 rounded w-40" />
                    <div className="h-5 bg-orange-400/40 rounded w-20" />
                  </div>
                  {[
                    { w: "w-28", c: "bg-red-400",    days: "18 días" },
                    { w: "w-36", c: "bg-red-400",    days: "15 días" },
                    { w: "w-24", c: "bg-orange-400", days: "9 días"  },
                    { w: "w-32", c: "bg-yellow-400", days: "6 días"  },
                  ].map((row, i) => (
                    <div key={i} className="px-4 py-2.5 border-b border-white/5 flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${row.c}`} />
                      <div className={`h-2.5 bg-white/30 rounded ${row.w}`} />
                      <div className="flex-1 h-2 bg-white/10 rounded ml-4" />
                      <div className="h-5 bg-white/15 rounded w-14 text-center" />
                      <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${row.c.replace("bg-", "bg-").replace("400", "400/30")} text-white/80`}>
                        {row.days}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Etiquetas flotantes */}
          <div className="absolute -bottom-4 -right-2 md:right-8 bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
            ✓ Alerta automática
          </div>
          <div className="absolute -top-3 right-4 md:right-48 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg hidden md:block">
            ⚠ 12 clientes en riesgo
          </div>
        </div>
      </div>
    </section>
  );
}
