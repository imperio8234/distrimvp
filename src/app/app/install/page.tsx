import Link from "next/link";

export const metadata = {
  title: "Instalar app · DistriApp",
  description: "Instrucciones para instalar la app de DistriApp en tu celular",
};

export default function AppInstallPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 to-blue-900 flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-brand-800 px-6 py-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-black text-3xl">D</span>
          </div>
          <h1 className="text-2xl font-black text-white">DistriApp</h1>
          <p className="text-blue-200 text-sm mt-1">App para vendedores y repartidores</p>
        </div>

        {/* Contenido */}
        <div className="px-6 py-8 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              📲 Cómo instalar la app
            </h2>
            <p className="text-gray-500 text-sm">
              La app de DistriApp se instala directamente en tu celular, sin necesidad de Play Store o App Store.
            </p>
          </div>

          {/* Pasos Android */}
          <div>
            <p className="text-sm font-bold text-gray-700 mb-3">🤖 Para Android</p>
            <ol className="space-y-3">
              {[
                "Abre el enlace de descarga en tu celular",
                "Si aparece una advertencia, toca «Instalar de todas formas»",
                "En Configuración → Seguridad → activa «Fuentes desconocidas»",
                "Abre el archivo descargado e instala",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Pasos iPhone */}
          <div>
            <p className="text-sm font-bold text-gray-700 mb-3">🍎 Para iPhone</p>
            <ol className="space-y-3">
              {[
                "Instala la app «Expo Go» desde la App Store",
                "Pide a tu administrador el enlace de la app",
                "Abre el enlace con Expo Go",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* CTA descarga */}
          <div className="bg-gray-50 rounded-xl p-5 text-center border">
            <p className="text-gray-500 text-xs mb-3">
              Pide el enlace de instalación al administrador de tu empresa
            </p>
            <p className="text-gray-400 text-xs">
              ¿Tienes problemas? Escríbenos a{" "}
              <a href="mailto:soporte@distriapp.co" className="text-brand-700 hover:underline">
                soporte@distriapp.co
              </a>
            </p>
          </div>

          <Link
            href="/"
            className="block text-center text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
