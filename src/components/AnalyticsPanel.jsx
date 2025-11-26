import React, { useState, useEffect, useMemo } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from "recharts";
import { Calendar, Download, TrendingUp, DollarSign, ShoppingBag } from "lucide-react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../services/firebase";
import jsPDF from "jspdf";
import "jspdf-autotable";
import dayjs from "dayjs";

// Colores para gráficos
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

export default function AnalyticsPanel() {
  const [dateRange, setDateRange] = useState("week"); // 'week' | 'month'
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- 1. CARGA DE DATOS ---
  useEffect(() => {
    const fetchSalesData = async () => {
      setLoading(true);
      try {
        const now = dayjs();
        let start, end;

        if (dateRange === "week") {
          start = now.startOf("week").toDate();
          end = now.endOf("week").toDate();
        } else {
          start = now.startOf("month").toDate();
          end = now.endOf("month").toDate();
        }

        // Consulta optimizada usando índices compuestos si es necesario
        const q = query(
          collection(db, "orders"),
          where("createdAt", ">=", start),
          where("createdAt", "<=", end),
          orderBy("createdAt", "asc")
        );

        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Convertir Timestamp de Firestore a Date JS
          createdAt: doc.data().createdAt?.toDate() 
        }));
        
        setOrders(data);
      } catch (error) {
        console.error("Error analítica:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSalesData();
  }, [dateRange]);

  // --- 2. PROCESAMIENTO DE DATOS (Estadísticas) ---
  const stats = useMemo(() => {
    const totalSales = orders.reduce((acc, o) => acc + (o.total || 0), 0);
    const totalOrders = orders.length;
    const avgTicket = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Agrupar por Día (Gráfico Barras)
    const salesByDay = {};
    // Agrupar por Categoría (Gráfico Pie)
    const salesByCategory = {};
    // Ranking Productos (Tabla)
    const productRanking = {};

    orders.forEach(order => {
      // Por día
      const dayKey = dayjs(order.createdAt).format("DD/MM");
      salesByDay[dayKey] = (salesByDay[dayKey] || 0) + order.total;

      // Procesar items (Usando el snapshot optimizado)
      if (order.itemsSnapshot) {
        order.itemsSnapshot.forEach(item => {
          // Categoría
          const cat = item.mainCategory || "Otros";
          salesByCategory[cat] = (salesByCategory[cat] || 0) + (item.total || 0);

          // Producto
          if (!productRanking[item.name]) {
            productRanking[item.name] = { name: item.name, qty: 0, total: 0 };
          }
          productRanking[item.name].qty += item.qty;
          productRanking[item.name].total += item.total;
        });
      }
    });

    // Formatear para Recharts
    const chartDataDay = Object.keys(salesByDay).map(key => ({
      name: key,
      Ventas: salesByDay[key]
    }));

    const chartDataCat = Object.keys(salesByCategory).map(key => ({
      name: key,
      value: salesByCategory[key]
    }));

    // Top 5 Productos
    const topProducts = Object.values(productRanking)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10); // Top 10

    return { totalSales, totalOrders, avgTicket, chartDataDay, chartDataCat, topProducts };
  }, [orders]);

  // --- 3. GENERAR REPORTE PDF ---
  const generatePDF = () => {
    const doc = new jsPDF();
    const title = `Reporte de Ventas - ${dateRange === 'week' ? 'Semanal' : 'Mensual'}`;
    const dateStr = dayjs().format("DD/MM/YYYY HH:mm");

    // Encabezado
    doc.setFontSize(20);
    doc.text("Pizza Brava - Analytics", 14, 22);
    doc.setFontSize(12);
    doc.text(title, 14, 32);
    doc.text(`Generado: ${dateStr}`, 14, 38);

    // Totales
    doc.autoTable({
      startY: 45,
      head: [['Ventas Totales', 'Órdenes', 'Ticket Promedio']],
      body: [[
        `$${stats.totalSales.toFixed(2)}`, 
        stats.totalOrders, 
        `$${stats.avgTicket.toFixed(2)}`
      ]],
    });

    // Top Productos
    doc.text("Top Productos Vendidos", 14, doc.lastAutoTable.finalY + 15);
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Producto', 'Cantidad', 'Total Generado']],
      body: stats.topProducts.map(p => [p.name, p.qty, `$${p.total.toFixed(2)}`]),
    });

    doc.save(`reporte_ventas_${dayjs().format("YYYY-MM-DD")}.pdf`);
  };

  if (loading) return <div className="p-8 text-center">Analizando datos...</div>;

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => setDateRange("week")}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${dateRange === 'week' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Esta Semana
          </button>
          <button 
            onClick={() => setDateRange("month")}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${dateRange === 'month' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Este Mes
          </button>
        </div>
        <button 
          onClick={generatePDF}
          className="mt-4 md:mt-0 flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Download size={18} /> Descargar Reporte PDF
        </button>
      </div>

      {/* KPIs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100 flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-full"><DollarSign size={24}/></div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Ventas Totales</p>
            <h3 className="text-2xl font-bold text-slate-800">${stats.totalSales.toFixed(2)}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full"><ShoppingBag size={24}/></div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Total Órdenes</p>
            <h3 className="text-2xl font-bold text-slate-800">{stats.totalOrders}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-purple-100 flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-full"><TrendingUp size={24}/></div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Ticket Promedio</p>
            <h3 className="text-2xl font-bold text-slate-800">${stats.avgTicket.toFixed(2)}</h3>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas por Día */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-700 mb-4">Tendencia de Ventas</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartDataDay}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip formatter={(val) => [`$${val}`, 'Ventas']} cursor={{fill: 'transparent'}} />
                <Bar dataKey="Ventas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categorías */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-700 mb-4">Ventas por Categoría</h3>
          <div className="h-64 w-full flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.chartDataCat}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.chartDataCat.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => `$${val.toFixed(2)}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tabla Detallada */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-700">Top Productos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
              <tr>
                <th className="px-6 py-3">Producto</th>
                <th className="px-6 py-3 text-center">Cant. Vendida</th>
                <th className="px-6 py-3 text-right">Total Generado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.topProducts.map((prod, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3 font-medium text-slate-800">{prod.name}</td>
                  <td className="px-6 py-3 text-center">
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">
                      {prod.qty}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right font-mono font-medium">${prod.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}