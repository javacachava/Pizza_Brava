import React, { useState, useEffect, useMemo } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from "recharts";
import { Download, AlertCircle } from "lucide-react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../services/firebase";
import jsPDF from "jspdf";
import "jspdf-autotable";
import dayjs from "dayjs";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

export default function AnalyticsPanel({ enablePrint = false }) {
  const [dateRange, setDateRange] = useState("week");
  const [statsData, setStatsData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const now = dayjs();
        let startStr, endStr;

        // Calculamos strings YYYY-MM-DD para consultar la colección daily_stats
        if (dateRange === "week") {
          startStr = now.startOf("week").format("YYYY-MM-DD");
          endStr = now.endOf("week").format("YYYY-MM-DD");
        } else {
          startStr = now.startOf("month").format("YYYY-MM-DD");
          endStr = now.endOf("month").format("YYYY-MM-DD");
        }

        // Consultamos SOLO los documentos de resumen (7 para semana, ~30 para mes)
        // Esto es muchísimo más barato que leer todas las órdenes individualmente
        const q = query(
          collection(db, "daily_stats"),
          where("date", ">=", startStr),
          where("date", "<=", endStr),
          orderBy("date", "asc")
        );

        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => doc.data());
        setStatsData(data);
      } catch (error) {
        console.error("Error analítica:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [dateRange]);

  const summary = useMemo(() => {
    let totalSales = 0;
    let totalOrders = 0;
    const categoryTotals = {};

    statsData.forEach(day => {
      totalSales += day.totalSales || 0;
      totalOrders += day.totalOrders || 0;
      
      // Agregar categorías
      if (day.categoryBreakdown) {
        Object.entries(day.categoryBreakdown).forEach(([cat, amount]) => {
          categoryTotals[cat] = (categoryTotals[cat] || 0) + amount;
        });
      }
    });

    const avgTicket = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Formatear datos para gráficos
    const chartDataDay = statsData.map(day => ({
        name: dayjs(day.date).format("DD/MM"),
        Ventas: day.totalSales
    }));

    const chartDataCat = Object.keys(categoryTotals).map(key => ({
        name: key,
        value: categoryTotals[key]
    }));

    return { totalSales, totalOrders, avgTicket, chartDataDay, chartDataCat };
  }, [statsData]);

  const generatePDF = () => {
    if (!enablePrint) return; 
    const doc = new jsPDF();
    const title = `Reporte de Ventas - ${dateRange === 'week' ? 'Semanal' : 'Mensual'}`;
    const dateStr = dayjs().format("DD/MM/YYYY HH:mm");

    doc.setFontSize(20);
    doc.text("Pizza Brava - Analytics", 14, 22);
    doc.setFontSize(12);
    doc.text(title, 14, 32);
    doc.text(`Generado: ${dateStr}`, 14, 38);

    doc.autoTable({
      startY: 45,
      head: [['Ventas Totales', 'Órdenes', 'Ticket Promedio']],
      body: [[`$${summary.totalSales.toFixed(2)}`, summary.totalOrders, `$${summary.avgTicket.toFixed(2)}`]],
    });

    doc.save(`reporte_ventas_${dayjs().format("YYYY-MM-DD")}.pdf`);
  };

  if (loading) return <div className="p-8 text-center">Cargando datos agregados...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
          <button onClick={() => setDateRange("week")} className={`px-4 py-2 rounded-md text-sm font-bold ${dateRange === 'week' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>Semanal</button>
          <button onClick={() => setDateRange("month")} className={`px-4 py-2 rounded-md text-sm font-bold ${dateRange === 'month' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>Mensual</button>
        </div>
        
        {enablePrint ? (
            <button onClick={generatePDF} className="mt-4 md:mt-0 flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800">
            <Download size={18} /> Descargar Reporte
            </button>
        ) : (
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold mt-4 md:mt-0">
                <AlertCircle size={16}/> Impresión Restringida
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100">
          <p className="text-slate-500 text-sm font-medium">Ventas Totales</p>
          <h3 className="text-2xl font-bold text-slate-800">${summary.totalSales.toFixed(2)}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
          <p className="text-slate-500 text-sm font-medium">Total Órdenes</p>
          <h3 className="text-2xl font-bold text-slate-800">{summary.totalOrders}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-purple-100">
          <p className="text-slate-500 text-sm font-medium">Ticket Promedio</p>
          <h3 className="text-2xl font-bold text-slate-800">${summary.avgTicket.toFixed(2)}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-700 mb-4">Tendencia de Ventas</h3>
          <div className="h-64 w-full">
            {summary.chartDataDay.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.chartDataDay}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} />
                  <Tooltip formatter={(val) => [`$${val}`, 'Ventas']} cursor={{fill: 'transparent'}} />
                  <Bar dataKey="Ventas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-slate-400">Sin datos</div>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-700 mb-4">Por Categoría</h3>
          <div className="h-64 w-full">
            {summary.chartDataCat.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={summary.chartDataCat} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {summary.chartDataCat.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => `$${val.toFixed(2)}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-slate-400">Sin datos</div>}
          </div>
        </div>
      </div>
    </div>
  );
}