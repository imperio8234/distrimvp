import Link from "next/link";

export const metadata = {
  title: "Tratamiento de datos · DistriApp",
  description: "Información sobre el tratamiento de datos personales en DistriApp",
};

export default function DataPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-5 py-6">
          <Link href="/" className="text-brand-700 font-semibold text-sm hover:underline">
            ← Volver al inicio
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Tratamiento de datos personales</h1>
          <p className="text-sm text-gray-500 mt-1">Ley 1581 de 2012 (Colombia)</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-10 space-y-6 text-gray-700">
        <p className="text-sm leading-relaxed">
          En DistriApp tratamos datos personales de administradores, vendedores, repartidores y de los clientes/negocios que nuestra propia clientela (las distribuidoras) gestiona en la plataforma. Lo hacemos bajo los principios de legalidad, finalidad, libertad, veracidad y seguridad previstos en la Ley 1581 de 2012.
        </p>

        <p className="text-sm leading-relaxed">
          Para conocer en detalle qué datos recogemos, para qué los usamos, con quién los compartimos, cuánto tiempo los conservamos y cómo puedes ejercer tus derechos (conocer, rectificar, actualizar, suprimir y revocar consentimiento), consulta nuestra{" "}
          <Link href="/privacy" className="text-brand-700 font-semibold hover:underline">
            Política de privacidad
          </Link>
          .
        </p>

        <p className="text-sm leading-relaxed">
          Si tienes preguntas o quieres ejercer tus derechos sobre tus datos personales, puedes contactarnos a través de los medios indicados en la web de DistriApp. Ante desacuerdo con el tratamiento, puedes presentar una queja ante la Superintendencia de Industria y Comercio (SIC).
        </p>

        <p className="text-xs text-gray-500 pt-4 border-t border-gray-200">
          DistriApp — Software para distribuidoras mayoristas en Colombia.
        </p>
      </main>
    </div>
  );
}
