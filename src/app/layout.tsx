import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DistribMVP — Panel de Control",
  description: "Sistema de gestión para distribuidoras mayoristas",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
