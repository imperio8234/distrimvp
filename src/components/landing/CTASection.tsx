import Link from "next/link";

export function CTASection() {
  return (
    <section className="py-20 md:py-28 bg-gradient-to-br from-brand-900 to-blue-900">
      <div className="max-w-3xl mx-auto px-5 text-center">
        <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
          ¿Listo para tener el control de tu distribuidora?
        </h2>
        <p className="text-blue-200 text-lg mb-10">
          Empieza hoy con 14 días gratis. Sin tarjeta de crédito, sin compromisos.
          Cancela cuando quieras.
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/register"
            className="bg-white text-brand-800 font-bold px-10 py-4 rounded-xl text-lg hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            Crear cuenta gratis
          </Link>
          <Link
            href="/login"
            className="border border-white/30 text-white font-semibold px-10 py-4 rounded-xl text-lg hover:bg-white/10 transition-all"
          >
            Ya tengo cuenta
          </Link>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-6 text-blue-200/60 text-sm">
          <span>✓ 14 días gratis</span>
          <span>✓ Sin tarjeta de crédito</span>
          <span>✓ Soporte en español</span>
          <span>✓ Datos en Colombia</span>
        </div>
      </div>
    </section>
  );
}
