import Link from "next/link";

export const metadata = {
  title: "Términos de uso · DistriApp",
  description: "Términos y condiciones de uso del servicio DistriApp",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-5 py-6">
          <Link href="/" className="text-brand-700 font-semibold text-sm hover:underline">
            ← Volver al inicio
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Términos de uso</h1>
          <p className="text-sm text-gray-500 mt-1">Última actualización: febrero 2025</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-10 space-y-8 text-gray-700">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Aceptación</h2>
          <p className="text-sm leading-relaxed">
            Al registrarte y utilizar DistriApp («el Servicio») aceptas estos términos. Si no estás de acuerdo, no uses el Servicio.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Descripción del servicio</h2>
          <p className="text-sm leading-relaxed">
            DistriApp es un software en la nube para distribuidoras mayoristas que permite gestionar clientes, vendedores, visitas, pedidos y entregas. El uso del Servicio está sujeto a tu plan de suscripción y a un período de prueba cuando aplique.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Cuenta y responsabilidad</h2>
          <p className="text-sm leading-relaxed">
            Eres responsable de mantener la confidencialidad de tu cuenta y de las actividades realizadas con ella. Debes proporcionar información veraz al registrarte y notificarnos cualquier uso no autorizado.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Uso aceptable</h2>
          <p className="text-sm leading-relaxed">
            No podrás usar el Servicio para fines ilegales, para enviar spam, para vulnerar derechos de terceros ni para intentar acceder a sistemas o datos ajenos a tu cuenta. Nos reservamos el derecho de suspender o dar de baja cuentas que incumplan estos términos.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Suscripción y pago</h2>
          <p className="text-sm leading-relaxed">
            Los planes de pago se describen en la web. El período de prueba gratuito, si aplica, termina en la fecha indicada. Después, la suscripción se renueva según el plan elegido hasta que la canceles. Los precios están en pesos colombianos (COP) y pueden cambiar con aviso previo.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Propiedad intelectual</h2>
          <p className="text-sm leading-relaxed">
            DistriApp y su marca, diseño y código son propiedad del titular del servicio. Tú conservas la propiedad de los datos que cargues (clientes, pedidos, etc.). Nos otorgas una licencia limitada para almacenar y procesar esos datos con el fin de prestar el Servicio.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Limitación de responsabilidad</h2>
          <p className="text-sm leading-relaxed">
            El Servicio se ofrece «tal cual». En la medida permitida por la ley, no seremos responsables por daños indirectos, pérdida de datos o lucro cesante derivados del uso o la imposibilidad de usar el Servicio.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Cambios</h2>
          <p className="text-sm leading-relaxed">
            Podemos modificar estos términos en el futuro. Los cambios relevantes se comunicarán por correo o mediante aviso en el Servicio. El uso continuado tras la entrada en vigor de los cambios constituye aceptación.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">9. Contacto</h2>
          <p className="text-sm leading-relaxed">
            Para dudas sobre estos términos: a través del formulario o correo indicado en la web de DistriApp.
          </p>
        </section>

        <p className="text-xs text-gray-500 pt-4 border-t border-gray-200">
          DistriApp — Software para distribuidoras mayoristas en Colombia.
        </p>
      </main>
    </div>
  );
}
