"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";

interface VendorStat {
  vendorId: string;
  vendorName: string;
  clientesAsignados: number;
  visitas: number;
  ordenes: number;
  monto: number;
  conversion: number;
}

interface DeliveryStat {
  deliveryPersonId: string;
  deliveryPersonName: string;
  total: number;
  delivered: number;
  failed: number;
  inProgress: number;
  successRate: number;
  avgDeliveryMinutes: number | null;
}

interface DailyVisit {
  date: string;
  count: number;
}

const cop = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

export default function RendimientoPage() {
  const [vendorStats, setVendorStats] = useState<VendorStat[]>([]);
  const [deliveryStats, setDeliveryStats] = useState<DeliveryStat[]>([]);
  const [dailyVisits, setDailyVisits] = useState<DailyVisit[]>([]);
  const [metaVisitas, setMetaVisitas] = useState(0);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"vendors" | "deliveries">("vendors");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [vendorRes, deliveryRes] = await Promise.all([
        fetch(`/api/stats/vendors?days=${days}`),
        fetch("/api/stats/deliveries"),
      ]);
      const vendorJson = await vendorRes.json();
      const deliveryJson = await deliveryRes.json();

      setVendorStats(vendorJson.data?.vendors ?? []);
      setDailyVisits(vendorJson.data?.dailyVisits ?? []);
      setMetaVisitas(vendorJson.data?.metaVisitasSemanales ?? 0);
      setDeliveryStats(deliveryJson.data?.deliveries ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalVisitas = vendorStats.reduce((s, v) => s + v.visitas, 0);
  const cumplimientoMeta =
    metaVisitas > 0 ? Math.min(100, Math.round((totalVisitas / metaVisitas) * 100)) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rendimiento del equipo</h1>
          <p className="text-gray-500 text-sm mt-1">KPIs de vendedores y repartidores</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Período:</label>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value={7}>Últimos 7 días</option>
            <option value={14}>Últimos 14 días</option>
            <option value={30}>Últimos 30 días</option>
          </select>
        </div>
      </div>

      {/* Alerta de meta */}
      {cumplimientoMeta !== null && (
        <div
          className={`flex items-center gap-4 px-4 py-3 rounded-lg border ${
            cumplimientoMeta >= 100
              ? "bg-green-50 border-green-200"
              : cumplimientoMeta >= 60
              ? "bg-yellow-50 border-yellow-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-800">
              Meta de visitas semanales: {metaVisitas}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {totalVisitas} visitas en el período — {cumplimientoMeta}% de cumplimiento
            </p>
          </div>
          <div className="w-32 bg-gray-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full ${
                cumplimientoMeta >= 100
                  ? "bg-green-500"
                  : cumplimientoMeta >= 60
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${Math.min(100, cumplimientoMeta)}%` }}
            />
          </div>
          <span
            className={`text-sm font-bold ${
              cumplimientoMeta >= 100
                ? "text-green-600"
                : cumplimientoMeta >= 60
                ? "text-yellow-600"
                : "text-red-600"
            }`}
          >
            {cumplimientoMeta}%
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab("vendors")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === "vendors" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Vendedores
        </button>
        <button
          onClick={() => setTab("deliveries")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === "deliveries" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Repartidores
        </button>
      </div>

      {/* ── Tab Vendedores ── */}
      {tab === "vendors" && (
        <div className="space-y-6">
          {/* Tabla ranking */}
          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h2 className="font-semibold text-gray-700">Ranking de vendedores</h2>
            </div>
            {vendorStats.length === 0 ? (
              <p className="p-8 text-center text-gray-400 italic text-sm">No hay vendedores activos.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="table-th">#</th>
                      <th className="table-th">Vendedor</th>
                      <th className="table-th text-right">Clientes</th>
                      <th className="table-th text-right">Visitas</th>
                      <th className="table-th text-right">Órdenes</th>
                      <th className="table-th text-right">Monto</th>
                      <th className="table-th text-right">Conversión</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[...vendorStats]
                      .sort((a, b) => b.monto - a.monto)
                      .map((v, idx) => (
                        <tr key={v.vendorId} className="hover:bg-gray-50">
                          <td className="table-td text-gray-400 text-sm">{idx + 1}</td>
                          <td className="table-td font-semibold text-gray-800">{v.vendorName}</td>
                          <td className="table-td text-right text-sm text-gray-600">{v.clientesAsignados}</td>
                          <td className="table-td text-right text-sm text-gray-600">{v.visitas}</td>
                          <td className="table-td text-right text-sm text-gray-600">{v.ordenes}</td>
                          <td className="table-td text-right text-sm font-semibold text-gray-800">
                            {cop(v.monto)}
                          </td>
                          <td className="table-td text-right">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                v.conversion >= 50
                                  ? "bg-green-100 text-green-700"
                                  : v.conversion >= 25
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {v.conversion}%
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Gráfica de barras: Visitas vs Órdenes */}
          {vendorStats.length > 0 && (
            <div className="card p-4">
              <h2 className="font-semibold text-gray-700 mb-4">Visitas vs Órdenes por vendedor</h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={vendorStats} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="vendorName" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="visitas" name="Visitas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ordenes" name="Órdenes" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Gráfica de línea: Visitas diarias 30 días */}
          {dailyVisits.length > 0 && (
            <div className="card p-4">
              <h2 className="font-semibold text-gray-700 mb-4">Visitas diarias (últimos 30 días)</h2>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={dailyVisits} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(d) =>
                      new Date(d).toLocaleDateString("es-CO", { day: "numeric", month: "short" })
                    }
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip
                    labelFormatter={(d) =>
                      new Date(d).toLocaleDateString("es-CO", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Visitas"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* ── Tab Repartidores ── */}
      {tab === "deliveries" && (
        <div className="space-y-6">
          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h2 className="font-semibold text-gray-700">Rendimiento de repartidores (hoy)</h2>
            </div>
            {deliveryStats.length === 0 ? (
              <p className="p-8 text-center text-gray-400 italic text-sm">No hay repartidores activos.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="table-th">Repartidor</th>
                      <th className="table-th text-right">Total</th>
                      <th className="table-th text-right">Entregadas</th>
                      <th className="table-th text-right">Fallidas</th>
                      <th className="table-th text-right">En curso</th>
                      <th className="table-th text-right">Éxito</th>
                      <th className="table-th text-right">T. promedio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {deliveryStats.map((d) => (
                      <tr key={d.deliveryPersonId} className="hover:bg-gray-50">
                        <td className="table-td font-semibold text-gray-800">{d.deliveryPersonName}</td>
                        <td className="table-td text-right text-sm text-gray-600">{d.total}</td>
                        <td className="table-td text-right text-sm text-green-600 font-medium">{d.delivered}</td>
                        <td className="table-td text-right text-sm text-red-600 font-medium">{d.failed}</td>
                        <td className="table-td text-right text-sm text-blue-600">{d.inProgress}</td>
                        <td className="table-td text-right">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                              d.successRate >= 80
                                ? "bg-green-100 text-green-700"
                                : d.successRate >= 50
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {d.successRate}%
                          </span>
                        </td>
                        <td className="table-td text-right text-sm text-gray-500">
                          {d.avgDeliveryMinutes != null ? `${d.avgDeliveryMinutes} min` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {deliveryStats.length > 0 && deliveryStats.some((d) => d.total > 0) && (
            <div className="card p-4">
              <h2 className="font-semibold text-gray-700 mb-4">Entregadas vs Fallidas por repartidor</h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={deliveryStats}
                  margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="deliveryPersonName" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="delivered" name="Entregadas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="failed" name="Fallidas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
