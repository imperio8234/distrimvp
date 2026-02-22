import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PlanCard } from "./PlanCard";
import { CreatePlanForm } from "./CreatePlanForm";

export const metadata = { title: "Planes · Super Admin" };

export default async function PlansPage() {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const plans = await prisma.plan.findMany({
    orderBy: { price: "asc" },
    include: { _count: { select: { subscriptions: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Planes</h1>
        <p className="text-gray-500 text-sm mt-1">
          Gestiona los planes de suscripción disponibles en la plataforma.
        </p>
      </div>

      {/* Planes existentes */}
      <div className="grid grid-cols-2 gap-4">
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={{ ...plan, price: Number(plan.price) }} />
        ))}
      </div>

      {/* Crear plan */}
      <div className="bg-white rounded-xl border p-5">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Crear nuevo plan</h2>
        <CreatePlanForm />
      </div>
    </div>
  );
}
