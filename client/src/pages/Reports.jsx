import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Download, FileText, BarChart3, PieChart, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell
} from "recharts";

const monthlyBurials = [
  { month: "Jan", burials: 12 },
  { month: "Feb", burials: 15 },
  { month: "Mar", burials: 18 },
  { month: "Apr", burials: 10 },
  { month: "May", burials: 14 },
  { month: "Jun", burials: 16 },
];

const plotStatusData = [
  { name: "Occupied", value: 892, color: "#ef4444" },
  { name: "Available", value: 283, color: "#22c55e" },
  { name: "Reserved", value: 72, color: "#eab308" },
];

const reports = [
  { name: "Monthly Burial Report", description: "Summary of all burials for the current month", icon: FileText },
  { name: "Lease Expiration Report", description: "List of all expiring leases in the next 90 days", icon: FileText },
  { name: "Occupancy Report", description: "Current cemetery occupancy statistics", icon: BarChart3 },
  { name: "Permit Status Report", description: "Overview of pending and approved permits", icon: FileText },
  { name: "Financial Report", description: "Revenue from leases and permits", icon: TrendingUp },
  { name: "Annual Statistics", description: "Yearly summary of cemetery operations", icon: PieChart },
];

export function Reports() {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">Reports</h1>
        <p className="text-gray-500 mt-1">
          Generate and view cemetery management reports
        </p>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

        {/* Bar Chart */}
        <Card className="p-6 bg-white shadow-sm rounded-xl border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Monthly Burials (2026)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyBurials}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="burials" fill="#16a34a" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Pie Chart */}
        <Card className="p-6 bg-white shadow-sm rounded-xl border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Plot Status Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <RePieChart>
              <Pie
                data={plotStatusData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
              >
                {plotStatusData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </RePieChart>
          </ResponsiveContainer>
        </Card>

      </div>

      {/* Reports List */}
      <Card className="p-6 bg-white shadow-sm rounded-xl border border-gray-200">
        <h2 className="text-xl font-semibold mb-6">Available Reports</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report, index) => {
            const Icon = report.icon;

            return (
              <div
                key={index}
                className="p-5 border rounded-lg hover:border-green-500 hover:shadow-md transition-all"
              >
                <div className="bg-green-100 p-2 rounded-lg w-fit mb-3">
                  <Icon className="w-5 h-5 text-green-600" />
                </div>

                <h3 className="font-semibold mb-2">{report.name}</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {report.description}
                </p>

                <Button className="w-full border border-gray-300 hover:bg-green-50 hover:border-green-500 hover:text-green-700">
                  <Download className="w-4 h-4 mr-2" />
                  Generate
                </Button>
              </div>
            );
          })}
        </div>

      </Card>

    </div>
  );
}