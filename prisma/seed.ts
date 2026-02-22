import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...");

  // ── Limpiar datos previos ─────────────────────────────────────
  await prisma.delivery.deleteMany();
  await prisma.order.deleteMany();
  await prisma.scheduledVisit.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();
  await prisma.plan.deleteMany();

  // ── Planes de suscripción ─────────────────────────────────────
  // No hay plan gratuito — todas las empresas inician con TRIAL de 14 días
  // sobre el plan PROFESIONAL para que puedan evaluar todas las funciones.
  const [planBasico, planProfesional, planEmpresarial] = await Promise.all([
    prisma.plan.create({
      data: {
        name: "BASICO",
        displayName: "Básico",
        description: "Para distribuidoras pequeñas. Hasta 3 vendedores y 200 clientes.",
        price: 79000,
        maxVendors: 3,
        maxCustomers: 200,
        maxDelivery: 2,
        dianEnabled: false,
        reportsEnabled: false,
        apiAccess: false,
        historyDays: 90,
      },
    }),
    prisma.plan.create({
      data: {
        name: "PROFESIONAL",
        displayName: "Profesional",
        description: "El más popular. Facturación DIAN y reportes avanzados incluidos.",
        price: 199000,
        maxVendors: 10,
        maxCustomers: 1000,
        maxDelivery: 5,
        dianEnabled: true,
        reportsEnabled: true,
        apiAccess: false,
        historyDays: 365,
      },
    }),
    prisma.plan.create({
      data: {
        name: "EMPRESARIAL",
        displayName: "Empresarial",
        description: "Sin límites. Todo incluido con API y soporte prioritario.",
        price: 499000,
        maxVendors: -1,
        maxCustomers: -1,
        maxDelivery: -1,
        dianEnabled: true,
        reportsEnabled: true,
        apiAccess: true,
        historyDays: 0, // ilimitado
      },
    }),
  ]);
  console.log(`✅ 3 planes creados (Básico, Profesional, Empresarial)`);

  // ── Empresa piloto ────────────────────────────────────────────
  const company = await prisma.company.create({
    data: {
      name: "Distribuidora El Progreso",
      phone: "310 500 1234",
      nit: "900.123.456-7",
      legalName: "Distribuidora El Progreso S.A.S.",
      tradeName: "El Progreso",
      address: "Cra 7 #45-10, Chapinero",
      city: "Bogotá",
      department: "Cundinamarca",
      postalCode: "110231",
      email: "contacto@progreso.co",
      taxRegime: "Responsable de IVA",
    },
  });
  console.log(`✅ Empresa creada: ${company.name}`);

  // ── Suscripción de la empresa piloto ─────────────────────────
  // La empresa piloto es usada para demos, por eso está ACTIVA en PROFESIONAL.
  // Las empresas reales que se registran arrancan con TRIAL de 14 días.
  const now = new Date();
  const trialEnd = new Date(now);
  trialEnd.setDate(trialEnd.getDate() + 14); // 14 días de prueba
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await prisma.subscription.create({
    data: {
      companyId: company.id,
      planId: planProfesional.id,
      status: "ACTIVE", // empresa piloto activa directamente
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      notes: "Empresa de demostración — creada por seed",
    },
  });
  console.log(`✅ Empresa piloto: ACTIVA en plan PROFESIONAL`);

  // ── Usuarios ──────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("123456", 10);

  // SUPER_ADMIN — sin empresa
  const superAdmin = await prisma.user.create({
    data: {
      companyId: null,
      name: "Super Admin",
      email: "superadmin@distriapp.co",
      password: passwordHash,
      role: "SUPER_ADMIN",
    },
  });
  console.log(`✅ Super Admin creado: ${superAdmin.email}`);

  const [admin, vendor, delivery] = await Promise.all([
    prisma.user.create({
      data: {
        companyId: company.id,
        name: "Carlos Mendoza",
        email: "admin@progreso.co",
        password: passwordHash,
        role: "ADMIN",
      },
    }),
    prisma.user.create({
      data: {
        companyId: company.id,
        name: "Juan López",
        email: "vendedor@progreso.co",
        password: passwordHash,
        role: "VENDOR",
      },
    }),
    prisma.user.create({
      data: {
        companyId: company.id,
        name: "Pedro Gómez",
        email: "repartidor@progreso.co",
        password: passwordHash,
        role: "DELIVERY",
      },
    }),
  ]);
  console.log(`✅ Usuarios creados: admin, vendedor, repartidor`);

  // ── Clientes con coordenadas GPS (zona Bogotá) ────────────────
  const clientesData = [
    {
      name: "Tienda Don Mario",
      ownerName: "Mario García",
      phone: "300 111 2222",
      address: "Cra 7 #45-12, Chapinero",
      lat: 4.6482,
      lng: -74.0628,
      daysAgo: 18,
    },
    {
      name: "Supermercado La 15",
      ownerName: "Rosa Martínez",
      phone: "310 333 4444",
      address: "Av 15 #72-30, Usaquén",
      lat: 4.6946,
      lng: -74.0344,
      daysAgo: 15,
    },
    {
      name: "Miscelánea Central",
      ownerName: "Luis Herrera",
      phone: "315 555 6666",
      address: "Calle 80 #30-15, Barrios Unidos",
      lat: 4.6964,
      lng: -74.081,
      daysAgo: 12,
    },
    {
      name: "Papelería El Surtido",
      ownerName: "Ana Rojas",
      phone: "320 777 8888",
      address: "Cra 50 #20-10, Puente Aranda",
      lat: 4.6136,
      lng: -74.1021,
      daysAgo: 9,
    },
    {
      name: "Droguería El Punto",
      ownerName: "Sergio Castro",
      phone: "311 999 0000",
      address: "Calle 13 #68-42, Fontibón",
      lat: 4.647,
      lng: -74.1202,
      daysAgo: 6,
    },
    {
      name: "Cafetería Los Andes",
      ownerName: "Claudia Vargas",
      phone: "301 222 3333",
      address: "Cra 13 #26-35, La Candelaria",
      lat: 4.5981,
      lng: -74.0762,
      daysAgo: 5,
    },
    {
      name: "Distribuidora Norte",
      ownerName: "Felipe Mora",
      phone: "312 444 5555",
      address: "Av 68 #90-20, Suba",
      lat: 4.7418,
      lng: -74.0868,
      daysAgo: 2,
    },
    {
      name: "Abarrotes La Esquina",
      ownerName: "Marleny Torres",
      phone: "317 666 7777",
      address: "Cra 90 #41-15, Engativá",
      lat: 4.6741,
      lng: -74.1101,
      daysAgo: 1,
    },
  ];

  const DAY_MS = 1000 * 60 * 60 * 24;
  const nowMs = Date.now();

  const customers = await Promise.all(
    clientesData.map((c) =>
      prisma.customer.create({
        data: {
          companyId: company.id,
          assignedVendorId: vendor.id,
          name: c.name,
          ownerName: c.ownerName,
          phone: c.phone,
          address: c.address,
          lat: c.lat,
          lng: c.lng,
          lastVisitAt: c.daysAgo ? new Date(nowMs - c.daysAgo * DAY_MS) : null,
        },
      })
    )
  );
  console.log(`✅ ${customers.length} clientes creados`);

  // ── Visitas de ejemplo ────────────────────────────────────────
  const visitsData = [
    { customerIdx: 6, daysAgo: 2, result: "ORDER_TAKEN" as const, amount: 320000, notes: "Pidió caja de 24" },
    { customerIdx: 7, daysAgo: 1, result: "ORDER_TAKEN" as const, amount: 185000, notes: null },
    { customerIdx: 4, daysAgo: 6, result: "ORDER_TAKEN" as const, amount: 97000, notes: "Prefiere entrega martes" },
    { customerIdx: 5, daysAgo: 5, result: "NOT_HOME" as const, amount: null, notes: "Estaba cerrado" },
    { customerIdx: 2, daysAgo: 12, result: "ORDER_TAKEN" as const, amount: 450000, notes: null },
    { customerIdx: 0, daysAgo: 18, result: "NOT_HOME" as const, amount: null, notes: "Llegué y estaba cerrado" },
  ];

  const visits = await Promise.all(
    visitsData.map((v) =>
      prisma.visit.create({
        data: {
          customerId: customers[v.customerIdx].id,
          vendorId: vendor.id,
          result: v.result,
          orderAmount: v.amount ?? null,
          notes: v.notes,
          visitedAt: new Date(nowMs - v.daysAgo * DAY_MS),
        },
      })
    )
  );
  console.log(`✅ ${visits.length} visitas creadas`);

  // ── Órdenes y entregas pendientes ────────────────────────────
  const ordersData = [
    { visitIdx: 0, customerIdx: 6, amount: 320000 },
    { visitIdx: 1, customerIdx: 7, amount: 185000 },
    { visitIdx: 2, customerIdx: 4, amount: 97000 },
  ];

  const orders = await Promise.all(
    ordersData.map((o) =>
      prisma.order.create({
        data: {
          companyId: company.id,
          customerId: customers[o.customerIdx].id,
          visitId: visits[o.visitIdx].id,
          amount: o.amount,
          status: "PENDING",
          deliveryDate: new Date(nowMs + DAY_MS),
        },
      })
    )
  );
  console.log(`✅ ${orders.length} órdenes pendientes creadas`);

  // ── Resumen ───────────────────────────────────────────────────
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅ Seed completado exitosamente\n");
  console.log("📋 Planes disponibles:");
  console.log("   Básico       → $79.000 COP/mes  (3 vendedores, 200 clientes)");
  console.log("   Profesional  → $199.000 COP/mes (10 vendedores, 1000 clientes, DIAN)");
  console.log("   Empresarial  → $499.000 COP/mes (ilimitado, DIAN, API)");
  console.log("\n🔑 Credenciales de acceso:");
  console.log("   Super Admin → superadmin@distriapp.co / 123456");
  console.log("   Dueño       → admin@progreso.co       / 123456");
  console.log("   Vendedor    → vendedor@progreso.co    / 123456");
  console.log("   Repartidor  → repartidor@progreso.co  / 123456");
  console.log("\n💡 Nuevas empresas registradas arrancan con TRIAL de 14 días");
  console.log("   El super admin asigna el plan pagado cuando el trial vence.");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
