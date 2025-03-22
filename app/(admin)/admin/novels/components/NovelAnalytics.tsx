import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

interface NovelAnalyticsProps {
  viewsData: {
    date: string;
    views: number;
  }[];
  engagementData: {
    date: string;
    comments: number;
    likes: number;
  }[];
  chapterData: {
    name: string;
    value: number;
    color: string;
  }[];
  readerData: {
    date: string;
    newReaders: number;
    returningReaders: number;
  }[];
}

const COLORS = {
  views: "#3B82F6",
  comments: "#8B5CF6",
  likes: "#10B981",
  newReaders: "#F59E0B",
  returningReaders: "#6366F1",
};

export function NovelAnalytics({
  viewsData,
  engagementData,
  chapterData,
  readerData,
}: NovelAnalyticsProps) {
  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="engagement">Engagement</TabsTrigger>
        <TabsTrigger value="readers">Readers</TabsTrigger>
        <TabsTrigger value="chapters">Chapters</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Views Over Time</CardTitle>
              <CardDescription>Daily view count for the past 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={viewsData}>
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.views} stopOpacity={0.1}/>
                        <stop offset="95%" stopColor={COLORS.views} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="views"
                      stroke={COLORS.views}
                      fillOpacity={1}
                      fill="url(#colorViews)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Chapter Distribution</CardTitle>
              <CardDescription>Distribution of chapters by status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chapterData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {chapterData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
      
      <TabsContent value="engagement">
        <Card>
          <CardHeader>
            <CardTitle>Engagement Metrics</CardTitle>
            <CardDescription>Comments and likes over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="comments"
                    stroke={COLORS.comments}
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="likes"
                    stroke={COLORS.likes}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="readers">
        <Card>
          <CardHeader>
            <CardTitle>Reader Demographics</CardTitle>
            <CardDescription>New vs returning readers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={readerData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="newReaders"
                    name="New Readers"
                    fill={COLORS.newReaders}
                    stackId="a"
                  />
                  <Bar
                    dataKey="returningReaders"
                    name="Returning Readers"
                    fill={COLORS.returningReaders}
                    stackId="a"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="chapters">
        <Card>
          <CardHeader>
            <CardTitle>Chapter Performance</CardTitle>
            <CardDescription>Views and engagement by chapter</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chapterData}
                  layout="vertical"
                  margin={{ left: 100 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip />
                  <Bar dataKey="value" fill={COLORS.views} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
} 