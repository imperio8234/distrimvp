"use client";

import Link from "next/link";
import { useState } from "react";

const LINKS = [
  { href: "#features",    label: "Características" },
  { href: "#how",         label: "Cómo funciona" },
  { href: "#app",         label: "App móvil" },
  { href: "#pricing",     label: "Precios" },
];

export function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-800 flex items-center justify-center">
            <span className="text-white font-black text-sm">D</span>
          </div>
          <span className="text-xl font-black text-brand-800">DistriApp</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          {LINKS.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="text-sm text-gray-600 hover:text-brand-800 font-medium transition-colors"
            >
              {label}
            </a>
          ))}
        </div>

        {/* CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-semibold text-gray-700 hover:text-brand-800 transition-colors"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="btn-primary text-sm px-5 py-2"
          >
            Empieza gratis
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 text-gray-600"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menú"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t px-5 pb-5 space-y-3">
          {LINKS.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="block py-2 text-gray-700 font-medium"
              onClick={() => setOpen(false)}
            >
              {label}
            </a>
          ))}
          <div className="flex flex-col gap-2 pt-3 border-t">
            <Link href="/login" className="text-center py-2.5 text-sm font-semibold text-brand-800 border border-brand-800 rounded-lg">
              Iniciar sesión
            </Link>
            <Link href="/register" className="btn-primary text-center text-sm py-2.5">
              Empieza gratis
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
