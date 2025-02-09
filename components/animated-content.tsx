import { Info } from "lucide-react";
import {
  Tooltip as RechartsTooltip,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from "recharts";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Statistics {
  storiesCreated: number;
  chaptersWritten: number;
  averageWordsPerDay: number;
  longestWritingStreak: number;
  currentWritingStreak: number;
  completionRate: number;
  lastWritingDate: string;
  wordHistory: Array<{
    date: string;
    words: number;
  }>;
}

const StatTooltip = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <HoverCard>
    <HoverCardTrigger asChild>
      <Info className="h-4 w-4 text-muted-foreground cursor-help ml-1" />
    </HoverCardTrigger>
    <HoverCardContent className="w-80">
      <div className="space-y-2">
        <h4 className="text-sm font-semibold">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </HoverCardContent>
  </HoverCard>
);

const WritingRadar = ({ statistics }: { statistics: Statistics }) => {
  const data = [
    { subject: "Stories", A: statistics.storiesCreated, fullMark: 10 },
    { subject: "Chapters", A: statistics.chaptersWritten, fullMark: 50 },
    { subject: "Words/Day", A: statistics.averageWordsPerDay, fullMark: 2000 },
    { subject: "Streak", A: statistics.currentWritingStreak, fullMark: 30 },
    {
      subject: "Completion",
      A: statistics.completionRate * 100,
      fullMark: 100,
    },
  ];

  return (
    <div className="h-[300px] w-full">
      <RadarChart outerRadius={90} width={400} height={300} data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" />
        <PolarRadiusAxis angle={30} domain={[0, "auto"]} />
        <Radar
          name="Writer Stats"
          dataKey="A"
          stroke="#10b981"
          fill="#10b981"
          fillOpacity={0.6}
        />
        <Legend />
      </RadarChart>
    </div>
  );
};

const WordsProgressChart = ({
  wordHistory,
}: {
  wordHistory: { date: string; words: number }[];
}) => (
  <div className="h-[200px] w-full">
    <AreaChart width={400} height={200} data={wordHistory}>
      <defs>
        <linearGradient id="wordsProgress" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
        </linearGradient>
      </defs>
      <RechartsTooltip />
      <Area
        type="monotone"
        dataKey="words"
        stroke="#10b981"
        fillOpacity={1}
        fill="url(#wordsProgress)"
      />
    </AreaChart>
  </div>
);

export function AnimatedContent({ statistics }: { statistics: Statistics }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Stories Created
            <StatTooltip
              title="Total Stories"
              description="The total number of stories you've created on the platform."
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{statistics.storiesCreated}</div>
          <p className="text-xs text-muted-foreground">
            {statistics.completionRate * 100}% completion rate
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Writing Streak
            <StatTooltip
              title="Current Writing Streak"
              description="Number of consecutive days you've written. Keep writing daily to maintain your streak!"
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {statistics.currentWritingStreak} days
          </div>
          <p className="text-xs text-muted-foreground">
            Longest streak: {statistics.longestWritingStreak} days
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Daily Average
            <StatTooltip
              title="Average Words Per Day"
              description="Your average word count per writing day, calculated from your active writing days."
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {statistics.averageWordsPerDay}
          </div>
          <p className="text-xs text-muted-foreground">words per day</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Chapters
            <StatTooltip
              title="Chapters Written"
              description="The total number of chapters you've written across all your stories."
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{statistics.chaptersWritten}</div>
          <p className="text-xs text-muted-foreground">
            Last updated:{" "}
            {new Date(statistics.lastWritingDate).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>

      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Writing Progress</CardTitle>
          <CardDescription>Your word count progress over time</CardDescription>
        </CardHeader>
        <CardContent>
          <WordsProgressChart wordHistory={statistics.wordHistory} />
        </CardContent>
      </Card>

      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Writing Overview</CardTitle>
          <CardDescription>Your writing statistics at a glance</CardDescription>
        </CardHeader>
        <CardContent>
          <WritingRadar statistics={statistics} />
        </CardContent>
      </Card>
    </div>
  );
}
