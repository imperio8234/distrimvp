import Link from "next/link";

export const metadata = {
  title: "Política de privacidad · DistriApp",
  description: "Política de privacidad y tratamiento de datos personales de DistriApp",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-5 py-6">
          <Link href="/" className="text-brand-700 font-semibold text-sm hover:underline">
            ← Volver al inicio
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Política de privacidad</h1>
          <p className="text-sm text-gray-500 mt-1">Última actualización: febrero 2025</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-10 space-y-8 text-gray-700">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Responsable del tratamiento</h2>
          <p className="text-sm leading-relaxed">
            El responsable del tratamiento de los datos personales que recogemos a través de DistriApp es el titular del producto DistriApp, con presencia en Colombia. Para ejercer tus derechos o consultas sobre datos personales puedes contactarnos por los medios indicados en la web.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Datos que recogemos</h2>
          <p className="text-sm leading-relaxed mb-2">
            Recogemos los datos necesarios para prestar el servicio:
          </p>
          <ul className="text-sm leading-relaxed list-disc list-inside space-y-1 ml-2">
            <li><strong>Cuenta y administración:</strong> nombre de la empresa, nombre del administrador, correo electrónico y contraseña (esta última almacenada de forma segura y no legible).</li>
            <li><strong>Equipo (vendedores/repartidores):</strong> nombre, correo, y opcionalmente token para notificaciones push y ubicación en tiempo real cuando usan la app.</li>
            <li><strong>Clientes de tu empresa:</strong> datos que tú cargas (nombre del negocio, dueño, teléfono, dirección, ubicación GPS, fotos, notas). Nosotros actuamos como encargados del tratamiento sobre estos datos según tus instrucciones.</li>
            <li><strong>Uso del servicio:</strong> visitas, pedidos, entregas, registros de check-in/check-out y métricas de uso para operar y mejorar el servicio.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Finalidad y base legal</h2>
          <p className="text-sm leading-relaxed">
            Tratamos los datos para (i) prestar, administrar y mejorar DistriApp, (ii) enviar comunicaciones de cuenta y, si lo autorizas, notificaciones push y mensajes sobre el servicio, (iii) cumplir obligaciones legales y (iv) defender derechos. La base legal es la ejecución del contrato de servicio, el consentimiento cuando aplique, y el interés legítimo en la seguridad y mejora del producto.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Compartir datos</h2>
          <p className="text-sm leading-relaxed">
            No vendemos tus datos. Podemos compartir información con proveedores que nos ayudan a operar (hosting, envío de correos, notificaciones push), bajo obligaciones de confidencialidad y solo para los fines indicados. Si la ley lo exige, podemos divulgar datos a autoridades.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Retención</h2>
          <p className="text-sm leading-relaxed">
            Conservamos los datos mientras tu cuenta esté activa y según los plazos de historial de tu plan. Tras la baja, podemos retener copias por un tiempo limitado por obligaciones legales o resolución de disputas, y después se eliminan o anonimizan.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Tus derechos (Colombia – Ley 1581 de 2012)</h2>
          <p className="text-sm leading-relaxed mb-2">
            Puedes solicitar conocer, rectificar, actualizar y, cuando proceda, solicitar la supresión de tus datos personales, así como revocar el consentimiento. Para ello escríbenos al contacto indicado en la web. Si consideras que el tratamiento no se ajusta a la ley, puedes acudir a la Superintendencia de Industria y Comercio (SIC).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Seguridad</h2>
          <p className="text-sm leading-relaxed">
            Aplicamos medidas técnicas y organizativas para proteger los datos contra acceso no autorizado, pérdida o alteración. Las contraseñas se almacenan cifradas y el acceso al servicio está protegido (HTTPS, autenticación).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Cambios</h2>
          <p className="text-sm leading-relaxed">
            Podemos actualizar esta política. Los cambios relevantes se publicarán en esta página y, si procede, se te notificará por correo o dentro del Servicio.
          </p>
        </section>

        <p className="text-xs text-gray-500 pt-4 border-t border-gray-200">
          DistriApp — Software para distribuidoras mayoristas en Colombia.
        </p>
      </main>
    </div>
  );
}
