// src/components/AnalyticsPanel.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Download, AlertCircle } from "lucide-react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../services/firebase";
import jsPDF from "jspdf";
import "jspdf-autotable";
import dayjs from "dayjs";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

export default function AnalyticsPanel({ enablePrint = false }) {
  const [dateRange, setDateRange] = useState("week"); // "today" | "week" | "month"
  const [stats, setStats] = useState([]);
  const [rangeMeta, setRangeMeta] = useState({ startStr: "", endStr: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar documentos de daily_stats según rango seleccionado
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const today = dayjs().startOf("day");

        let from;
        if (dateRange === "today") {
          from = today;
        } else if (dateRange === "month") {
          from = today.subtract(29, "day"); // Últimos 30 días
        } else {
          from = today.subtract(6, "day"); // Últimos 7 días
        }

        const startStr = from.format("YYYY-MM-DD");
        const endStr = today.format("YYYY-MM-DD");
        setRangeMeta({ startStr, endStr });

        const ref = collection(db, "daily_stats");
        const q = query(
          ref,
          where("date", ">=", startStr),
          where("date", "<=", endStr),
          orderBy("date", "asc")
        );

        const snap = await getDocs(q);
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setStats(docs);
      } catch (err) {
        console.error("Error cargando analytics:", err);
        setError("No se pudieron cargar los datos de ventas.");
        setStats([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [dateRange]);

  // Cálculo de resumen y normalización de datos
  const summary = useMemo(() => {
    if (!stats.length) {
      return {
        totalSales: 0,
        totalOrders: 0,
        avgTicket: 0,
        chartDataDaily: [],
        chartDataCat: []
      };
    }

    let totalSales = 0;
    let totalOrders = 0;

    const chartDataDaily = [];
    const categoryTotalsSales = {};  // Acumulador ventas por categoría
    const categoryTotalsOrders = {}; // Acumulador órdenes por categoría

    stats.forEach((s) => {
      const sales = Number(s.totalSales || 0);
      const orders = Number(s.totalOrders || 0);

      totalSales += sales;
      totalOrders += orders;

      chartDataDaily.push({
        date: s.date || s.id,
        totalSales: sales,
        totalOrders: orders
      });

      // Lógica robusta para categoryBreakdown
      const breakdown = s.categoryBreakdown || {};

      Object.entries(breakdown).forEach(([cat, raw]) => {
        let catSales = 0;
        let catOrders = 0;

        if (typeof raw === "number") {
          // Caso simple: "Pizzas": 150.00
          catSales = Number(raw || 0);
        } else if (raw && typeof raw === "object") {
          // Caso detallado: "Pizzas": { totalSales: 150, totalOrders: 10 }
          // Soporta keys 'sales' o 'totalSales', 'orders' o 'totalOrders'
          catSales = Number(raw.sales ?? raw.totalSales ?? 0);
          catOrders = Number(raw.orders ?? raw.totalOrders ?? 0);
        }

        // Protección contra NaN
        if (!Number.isFinite(catSales)) catSales = 0;
        if (!Number.isFinite(catOrders)) catOrders = 0;

        categoryTotalsSales[cat] = (categoryTotalsSales[cat] || 0) + catSales;
        categoryTotalsOrders[cat] = (categoryTotalsOrders[cat] || 0) + catOrders;
      });
    });

    // Convertir objeto de acumulados a array para Recharts
    const chartDataCat = Object.entries(categoryTotalsSales)
      .filter(([, val]) => val > 0) // Opcional: ocultar categorías con $0
      .map(([category, sales]) => ({
        category,
        totalSales: sales,
        totalOrders: categoryTotalsOrders[category] || 0
      }))
      .sort((a, b) => b.totalSales - a.totalSales); // Ordenar por ventas mayor a menor

    const avgTicket = totalOrders > 0 ? totalSales / totalOrders : 0;

    return { totalSales, totalOrders, avgTicket, chartDataDaily, chartDataCat };
  }, [stats]);

  const dateRangeLabel = useMemo(() => {
    if (dateRange === "today") return "Hoy";
    if (dateRange === "week") return "Últimos 7 días";
    return "Últimos 30 días";
  }, [dateRange]);

  // Generación de PDF
  const handleExportPDF = () => {
    if (!summary || !stats.length) {
      alert("No hay datos para exportar.");
      return;
    }

    try {
      const doc = new jsPDF();

      // Encabezado
      doc.setFontSize(18);
      doc.text("Reporte de Ventas - Pizza Brava", 14, 20);

      doc.setFontSize(11);
      doc.text(`Generado: ${dayjs().format("DD/MM/YYYY HH:mm")}`, 14, 28);
      doc.text(
        `Rango: ${dateRangeLabel} (${rangeMeta.startStr} al ${rangeMeta.endStr})`,
        14,
        34
      );

      // 1. Tabla Resumen General
      doc.autoTable({
        startY: 40,
        head: [["Ventas Totales", "Órdenes", "Ticket Promedio"]],
        body: [
          [
            `$${summary.totalSales.toFixed(2)}`,
            summary.totalOrders,
            `$${summary.avgTicket.toFixed(2)}`
          ]
        ],
        theme: 'grid',
        headStyles: { fillColor: [249, 115, 22] } // Naranja corporativo
      });

      // 2. Tabla Ventas por Categoría
      if (summary.chartDataCat.length > 0) {
        doc.text("Desglose por Categoría", 14, doc.lastAutoTable.finalY + 10);
        
        doc.autoTable({
          startY: doc.lastAutoTable.finalY + 15,
          head: [["Categoría", "Ventas ($)", "Órdenes (aprox)"]],
          body: summary.chartDataCat.map((row) => [
            row.category,
            `$${row.totalSales.toFixed(2)}`,
            row.totalOrders > 0 ? row.totalOrders : "-"
          ]),
          theme: 'striped'
        });
      }

      // 3. Tabla Detalle Diario
      doc.text("Detalle Diario", 14, doc.lastAutoTable.finalY + 10);
      
      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 15,
        head: [["Fecha", "Ventas ($)", "Órdenes"]],
        body: summary.chartDataDaily.map((row) => [
          row.date,
          `$${row.totalSales.toFixed(2)}`,
          row.totalOrders
        ])
      });

      doc.save(`ventas_${rangeMeta.startStr}_${rangeMeta.endStr}.pdf`);
    } catch (e) {
      console.error("Error generando PDF", e);
      alert("Error al generar el PDF. Verifica la consola.");
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 animate-pulse">
        Cargando estadísticas...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header / filtros / resumen rápido */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-orange-500">
            Reportes
          </p>
          <h2 className="text-xl font-black text-slate-900">
            Resumen de ventas
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {dateRangeLabel}{" "}
            {rangeMeta.startStr && rangeMeta.endStr && (
              <span className="inline-block ml-1 text-slate-400">
                ({rangeMeta.startStr} – {rangeMeta.endStr})
              </span>
            )}
          </p>
          {error && (
            <div className="mt-2 inline-flex items-center gap-1 text-xs text-red-500">
              <AlertCircle size={14} />
              {error}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setDateRange("today")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                dateRange === "today"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-white"
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => setDateRange("week")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                dateRange === "week"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-white"
              }`}
            >
              7 días
            </button>
            <button
              onClick={() => setDateRange("month")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                dateRange === "month"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-white"
              }`}
            >
              30 días
            </button>
          </div>

          {enablePrint && (
            <button
              onClick={handleExportPDF}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-sm transition-colors"
            >
              <Download size={14} />
              Exportar PDF
            </button>
          )}
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          label="Ventas totales"
          value={`$${summary.totalSales.toFixed(2)}`}
          subtitle="Facturación bruta en el periodo"
        />
        <MetricCard
          label="Órdenes"
          value={summary.totalOrders}
          subtitle="Cantidad de tickets generados"
        />
        <MetricCard
          label="Ticket promedio"
          value={
            summary.totalOrders
              ? `$${summary.avgTicket.toFixed(2)}`
              : "$0.00"
          }
          subtitle="Promedio de venta por orden"
        />
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ventas por día */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <h3 className="text-sm font-bold text-slate-800 mb-3">
            Tendencia de ventas
          </h3>
          <div className="h-72">
            {summary.chartDataDaily.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.chartDataDaily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    tickMargin={8}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    tickMargin={4}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <Tooltip
                    cursor={{ fill: "#f3f4f6" }}
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    formatter={(value, name) =>
                      name === "totalOrders"
                        ? [`${value}`, "Órdenes"]
                        : [`$${Number(value).toFixed(2)}`, "Ventas"]
                    }
                  />
                  <Legend wrapperStyle={{ paddingTop: "10px" }} />
                  <Bar
                    dataKey="totalSales"
                    name="Ventas ($)"
                    fill="#ea580c"
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                Sin datos en este rango.
              </div>
            )}
          </div>
        </div>

        {/* Ventas por categoría */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <h3 className="text-sm font-bold text-slate-800 mb-3">
            Ventas por categoría
          </h3>
          <div className="h-72">
            {summary.chartDataCat.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={summary.chartDataCat}
                    dataKey="totalSales"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    label={({ percent }) =>
                      `${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {summary.chartDataCat.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => `$${Number(val).toFixed(2)}`}
                    contentStyle={{ borderRadius: "8px" }}
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    wrapperStyle={{ fontSize: "11px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm px-4 text-center">
                <p>Sin desglose por categoría.</p>
                <p className="text-[10px] mt-1 opacity-70">
                  Las nuevas órdenes aparecerán aquí automáticamente.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, subtitle }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-1">
          {label}
        </p>
        <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
      </div>
      {subtitle && (
        <p className="mt-3 text-[11px] font-medium text-slate-500 bg-slate-50 inline-block px-2 py-1 rounded-md self-start">
          {subtitle}
        </p>
      )}
    </div>
  );
}