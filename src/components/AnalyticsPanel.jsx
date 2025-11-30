import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useLayoutEffect
} from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from "recharts";
import { Download, AlertCircle, CalendarClock } from "lucide-react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";
import { toast } from "react-hot-toast";

// ==========================================
// 1. CONFIGURACIÓN VISUAL Y DE NEGOCIO
// ==========================================

// [IMPORTANTE] PEGA AQUÍ EL BASE64 DE TU LOGO ENTRE LAS COMILLAS
const LOGO_BASE64 = ""; 

// Configuración de Datos Fijos para el Reporte
const BUSINESS_CONFIG = {
  nombre: "PIZZA BRAVA",
  logo_url: LOGO_BASE64, 
  responsable: {
    nombre: "Juan Trejo",
    rol: "Propietario"
  },
  tax_rate: 0.13
};

// Paleta de Colores "Dark Orange & Black" para PDF
const PDF_THEME = {
  orange: [194, 65, 12], // #C2410C - Naranja Quemado
  black: [25, 25, 25],   // #191919 - Negro Suave
  textGray: 80           // Gris oscuro
};

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

// ==========================================
// 2. LÓGICA DE NORMALIZACIÓN (DATA LAYER)
// ==========================================
// Esta función prepara los datos crudos para que el PDF nunca falle
const buildReportData = (rawStats, rangeMeta, summaryCalc) => {
  const ventasBrutas = Number(summaryCalc.totalSales || 0);
  
  // Cálculo de impuestos (Desglose)
  const impuestos = ventasBrutas > 0 
    ? ventasBrutas - (ventasBrutas / (1 + BUSINESS_CONFIG.tax_rate))
    : 0;
  const ventasNetas = ventasBrutas - impuestos;

  const ticketPromedio = summaryCalc.totalOrders > 0 
    ? ventasBrutas / summaryCalc.totalOrders 
    : 0;

  // Construcción de listas seguras
  const topCategorias = summaryCalc.chartDataCat.map(c => ({
    categoria: c.category || "Sin Categoría",
    ventas: Number(c.totalSales || 0),
    ordenes: Number(c.totalOrders || 0)
  }));

  const topProductos = summaryCalc.topProducts.map(p => ({
    producto: p.name || "Producto Desconocido",
    unidades: Number(p.qty || 0),
    ventas: Number(p.sales || 0)
  }));

  const formasPago = summaryCalc.paymentMethods.map(p => ({
    metodo: p.method || "Otro",
    monto: Number(p.sales || 0),
    porcentaje: Number(p.percentage || 0),
    transacciones: Number(p.count || 0)
  }));

  return {
    negocio: {
      nombre: BUSINESS_CONFIG.nombre,
      logo_url: BUSINESS_CONFIG.logo_url
    },
    formato: "vertical",
    responsable: BUSINESS_CONFIG.responsable,
    metadatos: {
      fecha_generado: dayjs().format("DD/MM/YYYY"),
      hora_generado: dayjs().format("HH:mm:ss"),
      rango_desde: rangeMeta.startStr,
      rango_hasta: rangeMeta.endStr
    },
    resumen_contable: {
      ventas_brutas: ventasBrutas,
      impuestos: impuestos,
      ventas_netas: ventasNetas,
      descuentos: 0, 
      devoluciones: 0 
    },
    forma_pago: formasPago,
    top_categorias: topCategorias,
    top_productos: topProductos,
    estadisticas: {
      ticket_promedio: ticketPromedio,
      transacciones_totales: Number(summaryCalc.totalOrders || 0),
      ordenes_por_dia: 0, // Dato derivado opcional
      dias_analizados: rawStats.length
    },
    notas_adicionales: ""
  };
};

export default function AnalyticsPanel({ enablePrint = false }) {
  const [dateRange, setDateRange] = useState("week"); 
  const [stats, setStats] = useState([]);
  const [rangeMeta, setRangeMeta] = useState({ startStr: "", endStr: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estado para advertencia de fin de mes
  const [showDeletionWarning, setShowDeletionWarning] = useState(false);
  const [daysUntilDeletion, setDaysUntilDeletion] = useState(0);

  // 1. Verificar si estamos cerca del fin de mes (Notificación Naranja)
  useEffect(() => {
    const today = dayjs();
    const endOfMonth = today.endOf("month");
    const diffDays = endOfMonth.diff(today, "day");

    if (diffDays <= 7) {
      setShowDeletionWarning(true);
      setDaysUntilDeletion(diffDays);
    } else {
      setShowDeletionWarning(false);
    }
  }, []);

  // 2. Carga de datos en tiempo real
  useEffect(() => {
    setLoading(true);
    setError(null);

    const today = dayjs().startOf("day");
    let from;

    if (dateRange === "today") {
      from = today;
    } else if (dateRange === "month") {
      from = today.subtract(29, "day"); // Vista por defecto de 30 días
    } else {
      from = today.subtract(6, "day"); 
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

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setStats(docs);
        setLoading(false);
      },
      (err) => {
        console.error("Error cargando analytics:", err);
        setError("No se pudieron cargar los datos de ventas.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [dateRange]);

  // 3. Cálculo de Resumen (Lógica existente preservada)
  const summary = useMemo(() => {
    if (!stats.length) {
      return { totalSales: 0, totalOrders: 0, avgTicket: 0, chartDataDaily: [], chartDataCat: [], paymentMethods: [], topProducts: [] };
    }
    let totalSales = 0; let totalOrders = 0;
    const chartDataDaily = []; const categoryTotalsSales = {}; const categoryTotalsOrders = {}; const paymentTotals = {}; const productTotals = {};

    stats.forEach((s) => {
      const sales = Number(s.totalSales || 0); const orders = Number(s.totalOrders || 0);
      totalSales += sales; totalOrders += orders;
      chartDataDaily.push({ date: s.date || s.id, totalSales: sales, totalOrders: orders });

      const catBreakdown = s.categoryBreakdown || {};
      const payBreakdown = s.paymentBreakdown || {};
      const prodBreakdown = s.productBreakdown || {};

      Object.entries(catBreakdown).forEach(([cat, raw]) => {
        let catSales = 0; let catOrders = 0;
        if (typeof raw === "number") { catSales = Number(raw || 0); } 
        else if (raw && typeof raw === "object") { catSales = Number(raw.sales || 0); catOrders = Number(raw.orders || 0); }
        categoryTotalsSales[cat] = (categoryTotalsSales[cat] || 0) + catSales;
        categoryTotalsOrders[cat] = (categoryTotalsOrders[cat] || 0) + catOrders;
      });

      Object.entries(payBreakdown).forEach(([method, data]) => {
        if (!paymentTotals[method]) paymentTotals[method] = { sales: 0, count: 0 };
        paymentTotals[method].sales += Number(data.sales || 0);
        paymentTotals[method].count += Number(data.count || 0);
      });

      Object.entries(prodBreakdown).forEach(([pid, pdata]) => {
        if (!productTotals[pid]) { productTotals[pid] = { name: pdata.name || "N/A", sales: 0, qty: 0 }; }
        productTotals[pid].sales += Number(pdata.sales || 0);
        productTotals[pid].qty += Number(pdata.qty || 0);
        if (pdata.name) productTotals[pid].name = pdata.name;
      });
    });

    const chartDataCat = Object.entries(categoryTotalsSales).filter(([, val]) => val > 0)
      .map(([category, sales]) => ({ category, totalSales: sales, totalOrders: categoryTotalsOrders[category] || 0 }))
      .sort((a, b) => b.totalSales - a.totalSales);

    const paymentMethods = Object.entries(paymentTotals)
      .map(([method, data]) => ({ method, sales: data.sales, count: data.count, percentage: totalSales > 0 ? (data.sales / totalSales) * 100 : 0 }))
      .sort((a, b) => b.sales - a.sales);

    const topProducts = Object.values(productTotals).sort((a, b) => b.sales - a.sales).slice(0, 10);
    const avgTicket = totalOrders > 0 ? totalSales / totalOrders : 0;

    return { totalSales, totalOrders, avgTicket, chartDataDaily, chartDataCat, paymentMethods, topProducts };
  }, [stats]);

  const dateRangeLabel = useMemo(() => {
    if (dateRange === "today") return "Hoy";
    if (dateRange === "week") return "Últimos 7 días";
    return "Mes actual";
  }, [dateRange]);

  // ==========================================
  // 4. GENERADOR DE PDF (NUEVO DISEÑO)
  // ==========================================
  const handleExportPDF = () => {
    // --- REGLAS DE NEGOCIO (VALIDACIÓN DE FECHAS) ---
    if (dateRange === "week") {
      if (stats.length < 7) {
        toast.error("Reporte Bloqueado: Se requieren 7 días completos de datos.", { duration: 5000, icon: <AlertCircle className="text-orange-500" /> });
        return;
      }
    }
    if (dateRange === "month") {
      const daysInCurrentMonth = dayjs().daysInMonth();
      if (stats.length < daysInCurrentMonth) {
        toast.error(`Reporte Bloqueado: Se requieren ${daysInCurrentMonth} días para el cierre mensual.`, { duration: 5000, icon: <AlertCircle className="text-orange-500" /> });
        return;
      }
    }
    if (!summary || !stats.length) {
      toast.error("No hay datos suficientes para generar el reporte.", { icon: "📊" });
      return;
    }

    try {
      // Normalizar datos
      const data = buildReportData(stats, rangeMeta, summary);
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      
      // --- HEADER: FONDO NARANJA OSCURO ---
      doc.setFillColor(...PDF_THEME.orange); 
      doc.rect(0, 0, pageWidth, 40, "F"); 

      // Logo
      if (data.negocio.logo_url) {
        try {
           doc.addImage(data.negocio.logo_url, 'PNG', 14, 5, 30, 30);
        } catch (err) {
           console.warn("No se pudo cargar el logo", err);
        }
      }

      // Nombre del Negocio
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(26);
      doc.setFont("helvetica", "bold");
      doc.text(data.negocio.nombre, 50, 28); 

      // --- SUB-HEADER ---
      let currentY = 55;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("REPORTE DE CIERRE DE CAJA", 14, currentY);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(PDF_THEME.textGray);
      doc.text(`Generado: ${data.metadatos.fecha_generado} ${data.metadatos.hora_generado}`, pageWidth - 14, currentY, { align: "right" });
      doc.text(`Periodo: ${data.metadatos.rango_desde} al ${data.metadatos.rango_hasta}`, pageWidth - 14, currentY + 5, { align: "right" });

      currentY += 15;

      // --- TABLAS (CABECERAS NEGRAS / MONTOS NARANJAS) ---

      // 1. Resumen Contable
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text("1. Resumen Contable", 14, currentY);
      currentY += 6;

      autoTable(doc, {
        startY: currentY,
        head: [["Concepto", "Monto", "Detalle"]],
        body: [
          ["Ventas Brutas", `$${data.resumen_contable.ventas_brutas.toFixed(2)}`, "Ingreso total"],
          ["Impuestos (13%)", `$${data.resumen_contable.impuestos.toFixed(2)}`, "IVA incluido"],
          ["Ventas Netas", `$${data.resumen_contable.ventas_netas.toFixed(2)}`, "Base imponible"],
          ["Descuentos", `$${data.resumen_contable.descuentos.toFixed(2)}`, ""],
          ["Devoluciones", `$${data.resumen_contable.devoluciones.toFixed(2)}`, ""]
        ],
        theme: "grid", 
        headStyles: { 
            fillColor: PDF_THEME.black,
            textColor: 255,
            fontStyle: 'bold',
            halign: 'center'
        },
        columnStyles: { 
            0: { fontStyle: "bold" },
            1: { halign: "right", fontStyle: "bold", textColor: PDF_THEME.orange }
        },
        styles: { lineColor: [200, 200, 200] }
      });
      currentY = doc.lastAutoTable.finalY + 15;

      // 2. Formas de Pago
      if (data.forma_pago.length > 0) {
        doc.text("2. Conciliación por Método de Pago", 14, currentY);
        currentY += 6;

        autoTable(doc, {
          startY: currentY,
          head: [["Método", "Transacciones", "% Total", "Monto"]],
          body: data.forma_pago.map(fp => [
            fp.metodo.toUpperCase(),
            fp.transacciones,
            `${fp.porcentaje.toFixed(1)}%`,
            `$${fp.monto.toFixed(2)}`
          ]),
          theme: "striped",
          headStyles: { fillColor: PDF_THEME.black },
          columnStyles: { 
              3: { halign: "right", fontStyle: "bold" } 
          }
        });
        currentY = doc.lastAutoTable.finalY + 15;
      }

      // 3. Top Categorías
      if (data.top_categorias.length > 0) {
        if (currentY > 230) { doc.addPage(); currentY = 20; }

        doc.text("3. Rendimiento por Categoría", 14, currentY);
        currentY += 6;

        autoTable(doc, {
          startY: currentY,
          head: [["Categoría", "Órdenes", "Ventas"]],
          body: data.top_categorias.map(c => [
            c.categoria,
            c.ordenes,
            `$${c.ventas.toFixed(2)}`
          ]),
          theme: "grid",
          headStyles: { fillColor: PDF_THEME.black },
          columnStyles: { 2: { halign: "right" } }
        });
        currentY = doc.lastAutoTable.finalY + 15;
      }

      // 4. Estadísticas
      if (currentY > 230) { doc.addPage(); currentY = 20; }

      doc.text("4. Estadísticas Operativas", 14, currentY);
      currentY += 6;

      autoTable(doc, {
        startY: currentY,
        body: [
          ["Ticket Promedio", `$${data.estadisticas.ticket_promedio.toFixed(2)}`],
          ["Transacciones Totales", data.estadisticas.transacciones_totales],
          ["Días Analizados", data.estadisticas.dias_analizados]
        ],
        theme: "plain",
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: { 
            0: { fontStyle: "bold", width: 60 },
            1: { halign: "left", fontStyle: "italic" }
        }
      });

      // --- FIRMA (FOOTER) ---
      const pageHeight = doc.internal.pageSize.height;
      const signatureY = pageHeight - 35;

      doc.setDrawColor(100); 
      doc.setLineWidth(0.5);
      doc.line(14, signatureY, 80, signatureY);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(data.responsable.nombre, 14, signatureY + 6);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(PDF_THEME.textGray);
      doc.text(data.responsable.rol, 14, signatureY + 11);
      
      const fileName = `cierre_${data.metadatos.fecha_generado.replace(/\//g, '-')}.pdf`;
      doc.save(fileName);
      toast.success("Cierre generado con éxito");

    } catch (e) {
      console.error("Error PDF:", e);
      toast.error("Error generando el PDF");
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
      {/* Notificación Naranja de Fin de Mes */}
      {showDeletionWarning && (
        <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <CalendarClock className="text-orange-500 shrink-0" size={24} />
          <div>
            <h4 className="text-orange-400 font-bold text-sm">
              Mantenimiento Mensual Programado
            </h4>
            <p className="text-slate-300 text-xs mt-1">
              Atención: Quedan <strong>{daysUntilDeletion} días</strong> para finalizar el mes. 
              El último día del mes, al terminar las 12:00, el sistema eliminará automáticamente 
              todos los registros de ventas del mes actual. Asegúrate de exportar tus reportes a tiempo.
            </p>
          </div>
        </div>
      )}

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
              Mes actual
            </button>
          </div>

          {enablePrint && (
            <button
              onClick={handleExportPDF}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 shadow-sm transition-colors"
            >
              <Download size={14} />
              Cierre de Caja
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

      {/* Gráfico de Ventas Diarias (Único gráfico restante) */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm p-4">
          <h3 className="text-sm font-bold text-slate-200 mb-3">
            Tendencia de ventas
          </h3>

          <ChartWrapper>
            {({ width, height }) =>
              summary.chartDataDaily.length ? (
                <BarChart
                  width={width}
                  height={height}
                  data={summary.chartDataDaily}
                >
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
                      margin: "0 0 4px 0"
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
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                  Sin datos en este rango.
                </div>
              )
            }
          </ChartWrapper>
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

function ChartWrapper({ children, className = "" }) {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      if (width > 0 && height > 0) {
        setSize({ width, height });
      }
    };

    updateSize();

    let observer;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(updateSize);
      observer.observe(el);
    }

    window.addEventListener("resize", updateSize);

    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  const hasSize = size.width > 0 && size.height > 0;

  return (
    <div
      ref={ref}
      className={`h-72 w-full min-w-0 relative ${className}`}
    >
      {hasSize ? (
        children(size)
      ) : (
        <div className="h-full flex items-center justify-center text-slate-500 text-sm">
          Cargando gráfico...
        </div>
      )}
    </div>
  );
}