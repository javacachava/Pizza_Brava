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
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";
import { toast } from "react-hot-toast";

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
          from = today.subtract(29, "day"); // Últimos 30 días (rango deslizante)
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
        chartDataCat: [],
        paymentMethods: [],
        topProducts: []
      };
    }

    let totalSales = 0;
    let totalOrders = 0;

    const chartDataDaily = [];
    const categoryTotalsSales = {};
    const categoryTotalsOrders = {};
    const paymentTotals = {};
    const productTotals = {}; // id -> { name, sales, qty }

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

      const catBreakdown = s.categoryBreakdown || {};
      const payBreakdown = s.paymentBreakdown || {};
      const prodBreakdown = s.productBreakdown || {};

      // Categorías
      Object.entries(catBreakdown).forEach(([cat, raw]) => {
        let catSales = 0;
        let catOrders = 0;
        if (typeof raw === "number") {
          catSales = Number(raw || 0);
        } else if (raw && typeof raw === "object") {
          catSales = Number(raw.sales ?? raw.totalSales ?? 0);
          catOrders = Number(raw.orders ?? raw.totalOrders ?? 0);
        }
        if (!Number.isFinite(catSales)) catSales = 0;
        if (!Number.isFinite(catOrders)) catOrders = 0;

        categoryTotalsSales[cat] = (categoryTotalsSales[cat] || 0) + catSales;
        categoryTotalsOrders[cat] = (categoryTotalsOrders[cat] || 0) + catOrders;
      });

      // Métodos de Pago
      Object.entries(payBreakdown).forEach(([method, data]) => {
        if (!paymentTotals[method]) paymentTotals[method] = { sales: 0, count: 0 };
        paymentTotals[method].sales += Number(data.sales || 0);
        paymentTotals[method].count += Number(data.count || 0);
      });

      // Top Productos
      Object.entries(prodBreakdown).forEach(([pid, pdata]) => {
        if (!productTotals[pid]) {
          productTotals[pid] = { name: pdata.name || "N/A", sales: 0, qty: 0 };
        }
        productTotals[pid].sales += Number(pdata.sales || 0);
        productTotals[pid].qty += Number(pdata.qty || 0);
        if (pdata.name) productTotals[pid].name = pdata.name;
      });
    });

    const chartDataCat = Object.entries(categoryTotalsSales)
      .filter(([, val]) => val > 0)
      .map(([category, sales]) => ({
        category,
        totalSales: sales,
        totalOrders: categoryTotalsOrders[category] || 0
      }))
      .sort((a, b) => b.totalSales - a.totalSales);

    const paymentMethods = Object.entries(paymentTotals)
      .map(([method, data]) => ({
        method,
        sales: data.sales,
        count: data.count,
        percentage: totalSales > 0 ? (data.sales / totalSales) * 100 : 0
      }))
      .sort((a, b) => b.sales - a.sales);

    const topProducts = Object.values(productTotals)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10);

    const avgTicket = totalOrders > 0 ? totalSales / totalOrders : 0;

    return {
      totalSales,
      totalOrders,
      avgTicket,
      chartDataDaily,
      chartDataCat,
      paymentMethods,
      topProducts
    };
  }, [stats]);

  const dateRangeLabel = useMemo(() => {
    if (dateRange === "today") return "Hoy";
    if (dateRange === "week") return "Últimos 7 días";
    return "Últimos 30 días";
  }, [dateRange]);

  // Generación de PDF PROFESIONAL + validación de rango completo
  const handleExportPDF = () => {
    if (!summary || !stats.length) {
      toast.error("No hay datos para exportar.", {
        icon: <AlertCircle className="text-red-500" />
      });
      return;
    }

    // --- Validación de días según rango ---
    const daysInRange =
      dayjs(rangeMeta.endStr).diff(dayjs(rangeMeta.startStr), "day") + 1;

    let requiredDays = 1;
    if (dateRange === "week") {
      requiredDays = 7;
    } else if (dateRange === "month") {
      // usamos el rango real (29, 30 o 31 días según corresponda)
      requiredDays = daysInRange;
    }

    if (stats.length < requiredDays) {
      toast.error(
        `No se puede generar el PDF de ${dateRangeLabel}.\n` +
          `Días con cierre: ${stats.length} / ${requiredDays}.`,
        {
          duration: 5000,
          style: { minWidth: "350px", background: "#334155", color: "#fff" }
        }
      );
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;

      const TAX_RATE = 0.13; // 13% IVA
      const taxAmount =
        summary.totalSales > 0
          ? summary.totalSales - summary.totalSales / (1 + TAX_RATE)
          : 0;
      const netSalesBase = summary.totalSales - taxAmount;

      // --- HEADER ---
      doc.setFillColor(249, 115, 22);
      doc.rect(0, 0, pageWidth, 40, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("REPORTE DE CIERRE", 14, 20);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Generado: ${dayjs().format("DD/MM/YYYY HH:mm")}`, 14, 28);
      doc.text(
        `Rango: ${rangeMeta.startStr} al ${rangeMeta.endStr} (${dateRangeLabel})`,
        14,
        33
      );

      doc.setTextColor(0, 0, 0);
      let currentY = 50;

      // --- 1. BLOQUE CONTABLE ---
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("1. Resumen Contable", 14, currentY);
      currentY += 8;

      autoTable(doc, {
        startY: currentY,
        head: [["Concepto", "Monto", "Notas"]],
        body: [
          [
            "Ventas Brutas",
            `$${summary.totalSales.toFixed(2)}`,
            "Total cobrado (Incl. Impuestos)"
          ],
          [
            "Impuestos (Estimado 13%)",
            `$${taxAmount.toFixed(2)}`,
            "IVA calculado sobre venta bruta"
          ],
          [
            "Ventas Netas",
            `$${netSalesBase.toFixed(2)}`,
            "Base imponible aprox."
          ],
          ["Descuentos / Promos", "$0.00", "No registrado en este periodo"],
          ["Devoluciones", "$0.00", "No registrado en este periodo"]
        ],
        theme: "grid",
        headStyles: { fillColor: [50, 50, 50] },
        columnStyles: {
          1: { fontStyle: "bold", halign: "right" }
        }
      });
      currentY = doc.lastAutoTable.finalY + 10;

      // Detalle Forma de Pago
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text("Detalle por Forma de Pago (Conciliación)", 14, currentY);
      currentY += 5;

      autoTable(doc, {
        startY: currentY,
        head: [["Método", "Ventas ($)", "% Total", "Operaciones"]],
        body:
          summary.paymentMethods.length > 0
            ? summary.paymentMethods.map((p) => [
                p.method.toUpperCase(),
                `$${p.sales.toFixed(2)}`,
                `${p.percentage.toFixed(1)}%`,
                p.count
              ])
            : [["Sin datos", "$0.00", "0%", "0"]],
        theme: "striped",
        headStyles: { fillColor: [70, 70, 70] },
        columnStyles: {
          1: { halign: "right" },
          2: { halign: "right" },
          3: { halign: "center" }
        }
      });
      currentY = doc.lastAutoTable.finalY + 15;

      // --- 2. BLOQUE DE GESTIÓN ---
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("2. Indicadores de Gestión", 14, currentY);
      currentY += 8;

      // Top Categorías
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text("Top Categorías (Participación)", 14, currentY);
      currentY += 5;

      autoTable(doc, {
        startY: currentY,
        head: [["Categoría", "Ventas ($)", "Órdenes (aprox)"]],
        body: summary.chartDataCat.map((row) => [
          row.category,
          `$${row.totalSales.toFixed(2)}`,
          row.totalOrders
        ]),
        theme: "grid"
      });

      if (doc.lastAutoTable.finalY > 200) {
        doc.addPage();
        currentY = 20;
      } else {
        currentY = doc.lastAutoTable.finalY + 10;
      }

      // Top Productos
      doc.text("Top 10 Productos Más Vendidos", 14, currentY);
      currentY += 5;

      autoTable(doc, {
        startY: currentY,
        head: [["Producto", "Unidades", "Ventas ($)"]],
        body:
          summary.topProducts.length > 0
            ? summary.topProducts.map((p) => [
                p.name,
                p.qty,
                `$${p.sales.toFixed(2)}`
              ])
            : [["Sin datos de productos", "-", "-"]],
        theme: "striped",
        headStyles: { fillColor: [249, 115, 22] }
      });
      currentY = doc.lastAutoTable.finalY + 15;

      // --- 3. BLOQUE ESTADÍSTICO ---
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("3. Estadísticas Operativas", 14, currentY);
      currentY += 8;

      const avgOrdersPerDay = (
        summary.totalOrders / Math.max(1, daysInRange)
      ).toFixed(1);

      autoTable(doc, {
        startY: currentY,
        body: [
          ["Ticket Promedio", `$${summary.avgTicket.toFixed(2)}`],
          ["Órdenes Promedio / Día", avgOrdersPerDay],
          ["Días analizados", daysInRange],
          ["Total Transacciones", summary.totalOrders]
        ],
        theme: "plain",
        styles: { fontSize: 10, cellPadding: 2 },
        columnStyles: {
          0: { fontStyle: "bold", width: 60 },
          1: { halign: "left" }
        }
      });

      doc.save(`cierre_caja_${rangeMeta.startStr}.pdf`);
      toast.success("Reporte PDF generado correctamente");
    } catch (e) {
      console.error("Error generando PDF", e);
      toast.error("Error al generar el PDF. Verifica la consola.");
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
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-800">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-orange-500">
            Reportes
          </p>
          <h2 className="text-xl font-black text-white">
            Resumen de ventas
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {dateRangeLabel}{" "}
            {rangeMeta.startStr && rangeMeta.endStr && (
              <span className="inline-block ml-1 text-slate-500">
                ({rangeMeta.startStr} – {rangeMeta.endStr})
              </span>
            )}
          </p>
          {error && (
            <div className="mt-2 inline-flex items-center gap-1 text-xs text-red-400">
              <AlertCircle size={14} />
              {error}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setDateRange("today")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                dateRange === "today"
                  ? "bg-slate-800 text-white shadow-sm border border-slate-700"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => setDateRange("week")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                dateRange === "week"
                  ? "bg-slate-800 text-white shadow-sm border border-slate-700"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              7 días
            </button>
            <button
              onClick={() => setDateRange("month")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                dateRange === "month"
                  ? "bg-slate-800 text-white shadow-sm border border-slate-700"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              30 días
            </button>
          </div>

          {enablePrint && (
            <button
              onClick={handleExportPDF}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 shadow-sm transition-colors"
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
        <div className="lg:col-span-2 bg-slate-900 rounded-xl border border-slate-800 shadow-sm p-4">
          <h3 className="text-sm font-bold text-slate-200 mb-3">
            Tendencia de ventas
          </h3>
          <div className="h-72 w-full min-w-0">
            {summary.chartDataDaily.length ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={summary.chartDataDaily}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#334155"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    tickMargin={8}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    tickMargin={4}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <Tooltip
                    cursor={{ fill: "#1e293b" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #334155",
                      backgroundColor: "#0f172a",
                      color: "#f8fafc",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.3)"
                    }}
                    itemStyle={{ color: "#e2e8f0" }}
                    labelStyle={{
                      color: "#94a3b8",
                      marginBottom: "0.25rem"
                    }}
                    formatter={(value, name) =>
                      name === "totalOrders"
                        ? [`${value}`, "Órdenes"]
                        : [`$${Number(value).toFixed(2)}`, "Ventas"]
                    }
                  />
                  <Legend
                    wrapperStyle={{
                      paddingTop: "10px",
                      color: "#cbd5e1"
                    }}
                  />
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
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                Sin datos en este rango.
              </div>
            )}
          </div>
        </div>

        {/* Ventas por categoría */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm p-4">
          <h3 className="text-sm font-bold text-slate-200 mb-3">
            Ventas por categoría
          </h3>
          <div className="h-72 w-full min-w-0">
            {summary.chartDataCat.length ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
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
                        stroke="#0f172a"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => `$${Number(val).toFixed(2)}`}
                    contentStyle={{
                      borderRadius: "8px",
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      color: "#f8fafc"
                    }}
                    itemStyle={{ color: "#e2e8f0" }}
                  />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm px-4 text-center">
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
    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm p-5 flex flex-col justify-between hover:border-orange-500/30 transition-colors">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 mb-1">
          {label}
        </p>
        <p className="text-3xl font-black text-white tracking-tight">
          {value}
        </p>
      </div>
      {subtitle && (
        <p className="mt-3 text-[11px] font-medium text-slate-400 bg-slate-950 inline-block px-2 py-1 rounded-md self-start border border-slate-800">
          {subtitle}
        </p>
      )}
    </div>
  );
}