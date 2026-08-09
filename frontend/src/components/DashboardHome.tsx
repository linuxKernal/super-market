import { useEffect, useState } from "react";
import { Users, Package, ShoppingBag, IndianRupee } from "lucide-react";
import { API_URL } from "@/config";
import { toast } from "react-toastify";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface MonthlyTrend {
    label: string;
    orders: number;
    revenue: number;
}

interface TopCustomer {
    id: number;
    fullname: string;
    email: string;
    image: string;
    total_spent: number;
}

interface Transaction {
    id: number;
    gateway_name: string;
    provider_name: string;
    amount_paid: number;
    payment_status: string;
    payment_method: string;
    created_at: string;
}

interface DashboardStats {
    users: number;
    products: number;
    categories: number;
    orders: number;
    revenue: number;
    monthlyTrends: MonthlyTrend[];
    recentTransactions: Transaction[];
    topCustomers: TopCustomer[];
}

export default function DashboardHome() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [duration, setDuration] = useState("monthly");

    useEffect(() => {
        async function fetchStats() {
            setLoading(true);
            try {
                const res = await fetch(`${API_URL}/dashboard/stats?duration=${duration}`, {
                    credentials: "include",
                });
                const data = await res.json();

                if (data.status === "success") {
                    setStats(data.data);
                } else {
                    toast.error(data.error || "Failed to fetch dashboard stats");
                }
            } catch (error) {
                toast.error("An error occurred while fetching dashboard stats");
            } finally {
                setLoading(false);
            }
        }

        fetchStats();
    }, [duration]);

    const cards = [
        {
            title: "Total Revenue",
            value: `₹${(stats?.revenue || 0).toLocaleString()}`,
            icon: IndianRupee,
            color: "from-blue-500 to-indigo-600",
            bg: "bg-blue-50 text-blue-600",
        },
        {
            title: "Total Orders",
            value: stats?.orders || 0,
            icon: ShoppingBag,
            color: "from-emerald-400 to-teal-500",
            bg: "bg-emerald-50 text-emerald-600",
        },
        {
            title: "Total Users",
            value: stats?.users || 0,
            icon: Users,
            color: "from-orange-400 to-amber-500",
            bg: "bg-orange-50 text-orange-600",
        },
        {
            title: "Total Products",
            value: stats?.products || 0,
            icon: Package,
            color: "from-purple-500 to-fuchsia-600",
            bg: "bg-purple-50 text-purple-600",
        },
    ];

    const getStatusStyle = (status: string) => {
        status = status.toLowerCase();
        if (status === "captured" || status === "success" || status === "completed") return "bg-green-100 text-green-700 border-green-200";
        if (status === "failed") return "bg-red-100 text-red-700 border-red-200";
        if (status === "pending") return "bg-amber-100 text-amber-700 border-amber-200";
        return "bg-slate-100 text-slate-700 border-slate-200";
    };

    return (
        <div className="p-8 pb-20 animate-fade-in-up space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                        Dashboard Overview
                        <div className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
                        </div>
                    </h1>
                    <p className="text-slate-500 mt-2">Here's a snapshot of your platform's current metrics</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, idx) => (
                    <div
                        key={card.title}
                        className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 relative overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                        style={{ animationDelay: `${idx * 100}ms` }}
                    >
                        <div className={`absolute -right-12 -top-12 size-32 rounded-full bg-gradient-to-br ${card.color} opacity-10 group-hover:scale-150 transition-transform duration-500`}></div>

                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-2">{card.title}</p>
                                {loading ? (
                                    <div className="h-8 w-24 bg-slate-200 rounded animate-pulse"></div>
                                ) : (
                                    <h3 className="text-3xl font-bold text-slate-800 tracking-tight">
                                        {card.value.toLocaleString()}
                                    </h3>
                                )}
                            </div>
                            <div className={`p-3 rounded-xl ${card.bg} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                                <card.icon className="size-6" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100">
                <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Performance Over Time</h2>
                        <p className="text-sm text-slate-500 mt-1">Orders and revenue tracking</p>
                    </div>
                    <select
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="border border-slate-200 rounded-lg text-sm px-3 py-1.5 bg-white text-slate-700 outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer shadow-sm transition-shadow hover:shadow"
                    >
                        <option value="day">Daily (Last 30 Days)</option>
                        <option value="monthly">Monthly (Last 12 Months)</option>
                        <option value="yearly">Yearly (Last 5 Years)</option>
                    </select>
                </div>
                <div className="h-[400px] w-full">
                    {loading ? (
                        <div className="h-full w-full bg-slate-50 animate-pulse rounded-xl flex items-center justify-center">
                            <span className="text-slate-400">Loading chart data...</span>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats?.monthlyTrends || []} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis yAxisId="left" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                                    cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Line yAxisId="left" type="monotone" name="Orders Received" dataKey="orders" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                <Line yAxisId="right" type="monotone" name="Revenue (₹)" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Recent Transactions</h2>
                            <p className="text-sm text-slate-500 mt-1">Latest payment activities from customers</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 rounded-lg">
                                <tr>
                                    <th className="px-6 py-4 font-semibold rounded-tl-lg">Date</th>
                                    <th className="px-6 py-4 font-semibold">Gateway</th>
                                    <th className="px-6 py-4 font-semibold">Method</th>
                                    <th className="px-6 py-4 font-semibold">Provider</th>
                                    <th className="px-6 py-4 font-semibold">Amount</th>
                                    <th className="px-6 py-4 font-semibold rounded-tr-lg">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="border-b border-slate-100 animate-pulse">
                                            <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                                            <td className="px-6 py-4"><div className="h-6 bg-slate-200 rounded-full w-20"></div></td>
                                        </tr>
                                    ))
                                ) : stats?.recentTransactions?.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                            No recent transactions available.
                                        </td>
                                    </tr>
                                ) : (
                                    stats?.recentTransactions?.map((tx) => (
                                        <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-medium">
                                                {new Date(tx.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-4 text-slate-700">
                                                {tx.gateway_name}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="capitalize">{tx.payment_method}</span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {tx.provider_name}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-slate-800">
                                                ₹{tx.amount_paid.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusStyle(tx.payment_status)}`}>
                                                    {tx.payment_status.toUpperCase()}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Top Customers</h2>
                            <p className="text-sm text-slate-500 mt-1">Highest spending users on the platform</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-4 border-b border-slate-50 pb-4 animate-pulse">
                                    <div className="size-12 rounded-full bg-slate-100 shrink-0"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-slate-100 rounded w-24"></div>
                                        <div className="h-3 bg-slate-100 rounded w-32"></div>
                                    </div>
                                    <div className="h-5 bg-slate-100 rounded w-16"></div>
                                </div>
                            ))
                        ) : stats?.topCustomers?.length === 0 ? (
                            <div className="py-8 text-center text-slate-500 flex flex-col items-center justify-center">
                                <Users className="size-10 text-slate-200 mb-2" />
                                <p>No completed orders yet.</p>
                            </div>
                        ) : (
                            stats?.topCustomers?.map((customer) => (
                                <div key={customer.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                    <div className="size-12 rounded-full overflow-hidden shrink-0 bg-emerald-50 flex items-center justify-center font-bold text-emerald-600 text-lg shadow-sm border border-emerald-100">
                                        {customer.image ? (
                                            <img src={customer.image} alt={customer.fullname} className="w-full h-full object-cover" />
                                        ) : (
                                            customer.fullname?.charAt(0)?.toUpperCase() || "?"
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 truncate">{customer.fullname}</p>
                                        <p className="text-xs text-slate-500 truncate">{customer.email}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-sm font-bold text-slate-800">₹{(customer.total_spent || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                        <p className="text-[10px] uppercase font-bold text-slate-400 mt-1 tracking-wider">Total Spend</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div >
        </div >
    );
}
