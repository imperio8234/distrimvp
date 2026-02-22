import Link from "next/link";

const LINKS = {
  Producto: [
    { label: "Características",  href: "#features" },
    { label: "Precios",          href: "#pricing" },
    { label: "App móvil",        href: "#app" },
  ],
  Empresa: [
    { label: "Iniciar sesión",   href: "/login" },
    { label: "Crear cuenta",     href: "/register" },
  ],
  Legal: [
    { label: "Términos de uso",        href: "/terms" },
    { label: "Política de privacidad", href: "/privacy" },
    { label: "Tratamiento de datos",   href: "/data" },
  ],
};

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-950 text-gray-400">
      <div className="max-w-6xl mx-auto px-5 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Logo + descripción */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-brand-800 flex items-center justify-center">
                <span className="text-white font-black text-sm">D</span>
              </div>
              <span className="text-xl font-black text-white">DistriApp</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Software colombiano para distribuidoras mayoristas. Hecho para el mercado local.
            </p>
            <p className="text-xs text-gray-600 mt-3">
              📍 Bogotá, Colombia
            </p>
          </div>

          {/* Links */}
          {Object.entries(LINKS).map(([category, links]) => (
            <div key={category}>
              <p className="text-white font-semibold text-sm mb-3">{category}</p>
              <ul className="space-y-2">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-600">
            © {year} DistriApp. Todos los derechos reservados.
          </p>
          <p className="text-xs text-gray-600">
            Hecho con ❤️ para las distribuidoras de Colombia
          </p>
        </div>
      </div>
    </footer>
  );
}
