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
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const stats = useMemo(() => {
    const totalSales = orders.reduce((acc, o) => acc + (o.total || 0), 0);
    const totalOrders = orders.length;
    const avgTicket = totalOrders > 0 ? totalSales / totalOrders : 0;

    const salesByDay = {};
    const salesByCategory = {};
    const productRanking = {};

    orders.forEach(order => {
      const dayKey = dayjs(order.createdAt).format("DD/MM");
      salesByDay[dayKey] = (salesByDay[dayKey] || 0) + order.total;

      if (order.itemsSnapshot) {
        order.itemsSnapshot.forEach(item => {
          const cat = item.mainCategory || "Otros";
          salesByCategory[cat] = (salesByCategory[cat] || 0) + (item.total || 0);

          if (!productRanking[item.name]) {
            productRanking[item.name] = { name: item.name, qty: 0, total: 0 };
          }
          productRanking[item.name].qty += item.qty;
          productRanking[item.name].total += item.total;
        });
      }
    });

    const chartDataDay = Object.keys(salesByDay).map(key => ({ name: key, Ventas: salesByDay[key] }));
    const chartDataCat = Object.keys(salesByCategory).map(key => ({ name: key, value: salesByCategory[key] }));
    const topProducts = Object.values(productRanking).sort((a, b) => b.qty - a.qty).slice(0, 10);

    return { totalSales, totalOrders, avgTicket, chartDataDay, chartDataCat, topProducts };
  }, [orders]);

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
      body: [[`$${stats.totalSales.toFixed(2)}`, stats.totalOrders, `$${stats.avgTicket.toFixed(2)}`]],
    });

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
          <h3 className="text-2xl font-bold text-slate-800">${stats.totalSales.toFixed(2)}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
          <p className="text-slate-500 text-sm font-medium">Total Órdenes</p>
          <h3 className="text-2xl font-bold text-slate-800">{stats.totalOrders}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-purple-100">
          <p className="text-slate-500 text-sm font-medium">Ticket Promedio</p>
          <h3 className="text-2xl font-bold text-slate-800">${stats.avgTicket.toFixed(2)}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-700 mb-4">Tendencia de Ventas</h3>
          <div className="h-64 w-full">
            {stats.chartDataDay.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chartDataDay}>
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
            {stats.chartDataCat.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.chartDataCat} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {stats.chartDataCat.map((entry, index) => (
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