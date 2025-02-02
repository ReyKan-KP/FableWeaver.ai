"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CalendarDays, Activity, BookOpen, Settings } from "lucide-react";
import { ProfileForm } from "./profile-form";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

interface AnimatedContentProps {
  user: {
    id: string;
    name: string;
    email: string;
    image: string;
  };
}

export function AnimatedContent({ user }: AnimatedContentProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className="container max-w-6xl mx-auto space-y-8"
    >
      <motion.div
        variants={fadeInUp}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            Profile Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your account and view your activity
          </p>
        </div>
        {/* <Badge variant="secondary" className="px-4 py-2 text-sm animate-pulse">
          Premium Member
        </Badge> */}
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div variants={fadeInUp}>
          <Card className="h-full transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                <CardTitle>Account Overview</CardTitle>
              </div>
              <CardDescription>
                View and manage your account details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm user={user} />
            </CardContent>
          </Card>
        </motion.div>

        <div className="space-y-6">
          <motion.div variants={fadeInUp}>
            <Card className="transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  <CardTitle>Account Statistics</CardTitle>
                </div>
                <CardDescription>
                  Your account activity and usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-secondary/20">
                    <p className="text-sm text-muted-foreground">
                      Stories Created
                    </p>
                    <h3 className="text-2xl font-bold text-primary">24</h3>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/20">
                    <p className="text-sm text-muted-foreground">Characters</p>
                    <h3 className="text-2xl font-bold text-primary">48</h3>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card className="transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-primary" />
                  <CardTitle>Recent Activity</CardTitle>
                </div>
                <CardDescription>
                  Your latest actions and updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-3 rounded-lg bg-secondary/10 transition-colors hover:bg-secondary/20">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">
                        Created new story &quot;The Lost Kingdom&quot;
                      </p>
                      <p className="text-xs text-muted-foreground">
                        2 hours ago
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-3 rounded-lg bg-secondary/10 transition-colors hover:bg-secondary/20">
                    <Activity className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">
                        Updated character profile
                      </p>
                      <p className="text-xs text-muted-foreground">Yesterday</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
