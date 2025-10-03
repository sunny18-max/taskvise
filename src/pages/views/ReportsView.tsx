// views/ReportsView.tsx
import { Card, CardContent } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import type { Employee } from '../types/managerTypes';

interface ReportsViewProps {
  employees: Employee[];
}

export const ReportsView = ({ employees }: ReportsViewProps) => (
  <div>
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gradient">Reports & Analytics</h1>
      <p className="text-muted-foreground">Detailed insights and performance metrics</p>
    </div>
    <Card className="border-0 shadow-lg">
      <CardContent className="p-6">
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={employees}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fullName" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="productivity" fill="#8884d8" name="Productivity %" />
              <Bar dataKey="completedTasks" fill="#82ca9d" name="Completed Tasks" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  </div>
);