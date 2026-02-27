import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/Sidebar";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) redirect("/login");
  if (session.user.role === "SUPER_ADMIN") redirect("/superadmin");
  if (session.user.role !== "ADMIN") redirect("/login");
  if (!session.user.companyId) redirect("/login");

  // Verificar estado de suscripción para mostrar banner
  const sub = await prisma.subscription.findUnique({
    where: { companyId: session.user.companyId },
    select: { status: true, trialEndsAt: true, currentPeriodEnd: true },
  });

  const now = new Date();
  const readOnly = !sub
    || sub.currentPeriodEnd < now
    || (sub.status === "TRIAL" && !!sub.trialEndsAt && sub.trialEndsAt < now)
    || sub.status === "PAST_DUE"
    || sub.status === "CANCELLED"
    || sub.status === "SUSPENDED";

  return (
    <SidebarProvider>
      <AppSidebar
        userName={session.user.name ?? ""}
        companyName={session.user.companyName ?? ""}
      />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
          <SidebarTrigger className="-ml-1" />
        </header>
        <div className="flex flex-1 flex-col overflow-auto">
          {readOnly && (
            <div className="bg-red-600 text-white text-sm px-6 py-2.5 flex items-center justify-between gap-4 shrink-0">
              <span>
                ⚠️ <strong>Modo solo lectura</strong> — Tu suscripción ha vencido o está inactiva.
                No puedes crear ni modificar datos.
              </span>
              <Link href="/settings" className="underline font-medium hover:text-red-100 shrink-0">
                Ver plan →
              </Link>
            </div>
          )}
          <main className="flex-1 overflow-auto">
            <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
