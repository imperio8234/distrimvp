"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const ONBOARDING_DISMISSED_KEY = "distrib_onboarding_dismissed";

interface OnboardingCardProps {
  customerCount: number;
  vendorCount: number;
}

const STEPS = [
  {
    id: "clientes",
    title: "Agrega tu primer cliente",
    description: "Carga al menos un cliente con nombre y ubicación para empezar.",
    href: "/customers",
    cta: "Ir a Clientes",
    doneWhen: (c: number) => c > 0,
  },
  {
    id: "vendedores",
    title: "Crea un vendedor",
    description: "Registra al menos un vendedor para que pueda usar la app y visitar clientes.",
    href: "/users",
    cta: "Ir a Usuarios",
    doneWhen: (_c: number, v: number) => v > 0,
  },
  {
    id: "asignar",
    title: "Asigna clientes al vendedor",
    description: "En el mapa de asignación asigna cada cliente a un vendedor.",
    href: "/mapa-asignacion",
    cta: "Ir al Mapa",
    doneWhen: (c: number, v: number) => c > 0 && v > 0,
  },
] as const;

export function OnboardingCard({ customerCount, vendorCount }: OnboardingCardProps) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(ONBOARDING_DISMISSED_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    try {
      localStorage.setItem(ONBOARDING_DISMISSED_KEY, "1");
      setDismissed(true);
    } catch {
      setDismissed(true);
    }
  };

  const needsOnboarding = customerCount === 0 || vendorCount === 0;
  const show = needsOnboarding && !dismissed;

  if (!show) return null;

  const stepsWithStatus = STEPS.map((step) => ({
    ...step,
    done: step.doneWhen(customerCount, vendorCount),
  }));
  const allDone = stepsWithStatus.every((s) => s.done);
  const nextStep = stepsWithStatus.find((s) => !s.done);

  return (
    <div className="rounded-xl border border-brand-200 bg-gradient-to-br from-brand-50 to-blue-50 p-5 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="text-2xl">👋</span>
            Configura tu cuenta en 3 pasos
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Sigue estos pasos para tener todo listo y que tu equipo empiece a trabajar.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-xs text-gray-500 hover:text-gray-700 shrink-0"
          aria-label="Omitir guía"
        >
          Omitir
        </button>
      </div>

      <ol className="mt-5 space-y-4">
        {stepsWithStatus.map((step, index) => (
          <li key={step.id} className="flex items-start gap-4">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                step.done
                  ? "bg-green-500 text-white"
                  : nextStep?.id === step.id
                  ? "bg-brand-600 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {step.done ? "✓" : index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className={`font-semibold ${step.done ? "text-gray-500 line-through" : "text-gray-900"}`}>
                {step.title}
              </p>
              <p className="text-sm text-gray-600 mt-0.5">{step.description}</p>
              {!step.done && (
                <Link
                  href={step.href}
                  className="inline-block mt-2 text-sm font-semibold text-brand-700 hover:text-brand-800 hover:underline"
                >
                  {step.cta} →
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>

      {allDone && (
        <div className="mt-5 pt-4 border-t border-brand-100">
          <p className="text-sm font-semibold text-green-700">
            ¡Listo! Ya puedes compartir la app con tu equipo y empezar a registrar visitas.
          </p>
          <Link
            href="/app/install"
            className="inline-block mt-2 text-sm font-semibold text-brand-700 hover:underline"
          >
            Ver enlace de descarga de la app →
          </Link>
          <button
            type="button"
            onClick={handleDismiss}
            className="block mt-3 text-xs text-gray-500 hover:text-gray-700"
          >
            Cerrar esta guía
          </button>
        </div>
      )}
    </div>
  );
}
