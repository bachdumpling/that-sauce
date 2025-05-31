import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import {
  Users,
  CheckCircle,
  Clock,
  TrendingUp,
  Eye,
  FileText,
  Globe,
  BookOpen,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Get creator stats
  const [
    { count: totalCreators },
    { count: approvedCreators },
    { count: pendingCreators },
    { count: rejectedCreators },
  ] = await Promise.all([
    supabase.from("creators").select("*", { count: "exact", head: true }),
    supabase
      .from("creators")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved"),
    supabase
      .from("creators")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("unqualified_creators")
      .select("*", { count: "exact", head: true }),
  ]);

  // Get recent creators
  const { data: recentCreators } = await supabase
    .from("creators")
    .select("id, username, created_at, status, avatar_url")
    .order("created_at", { ascending: false })
    .limit(5);

  // Get total projects
  const { count: totalProjects } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true });

  const stats = [
    {
      title: "Total Creators",
      value: totalCreators || 0,
      icon: Users,
      description: "Registered creators",
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950",
    },
    {
      title: "Approved",
      value: approvedCreators || 0,
      icon: CheckCircle,
      description: "Active creators",
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-950",
    },
    {
      title: "Pending Review",
      value: pendingCreators || 0,
      icon: Clock,
      description: "Awaiting approval",
      color: "text-yellow-600 dark:text-yellow-400",
      bg: "bg-yellow-50 dark:bg-yellow-950",
    },
    {
      title: "Total Projects",
      value: totalProjects || 0,
      icon: TrendingUp,
      description: "Creative projects",
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-950",
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to the That Sauce admin dashboard. Monitor platform activity
          and manage creators.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-md ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Creator Management
            </CardTitle>
            <CardDescription>Manage creator applications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full justify-start">
              <Link href="/admin/creators">
                <Users className="h-4 w-4 mr-2" />
                Manage Creators
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full justify-start">
              <Link href="/admin/creators?status=pending">
                <Clock className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Review Pending ({pendingCreators || 0})</span>
                <span className="sm:hidden">Pending ({pendingCreators || 0})</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full justify-start">
              <Link href="/search">
                <Eye className="h-4 w-4 mr-2" />
                View Platform
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Content Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Content Studio
            </CardTitle>
            <CardDescription>Manage site content with Sanity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full justify-start">
              <Link href="/admin/content">
                <FileText className="h-4 w-4 mr-2" />
                Content Dashboard
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full justify-start">
              <Link href="/admin/content/studio">
                <Globe className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Embedded Studio</span>
                <span className="sm:hidden">Studio</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full justify-start">
              <Link href="/studio" target="_blank" rel="noopener noreferrer">
                <BookOpen className="h-4 w-4 mr-2" />
                Full Studio
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Creators */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Recent Creators</CardTitle>
            <CardDescription>Latest creator registrations</CardDescription>
          </CardHeader>
          <CardContent>
            {recentCreators && recentCreators.length > 0 ? (
              <div className="space-y-3">
                {recentCreators.map((creator) => (
                  <div
                    key={creator.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        {creator.avatar_url ? (
                          <img
                            src={creator.avatar_url}
                            alt={creator.username}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <Users className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {creator.username}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(creator.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        creator.status === "approved"
                          ? "default"
                          : creator.status === "pending"
                            ? "secondary"
                            : "destructive"
                      }
                      className="ml-2 flex-shrink-0"
                    >
                      {creator.status}
                    </Badge>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="w-full mt-4"
                >
                  <Link href="/admin/creators">View All Creators</Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-6">
                <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  No recent creators
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Platform Health */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Health</CardTitle>
          <CardDescription>
            Overview of platform statistics and health metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="text-center p-4 sm:p-6 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                {Math.round(
                  ((approvedCreators || 0) / Math.max(totalCreators || 1, 1)) *
                    100
                )}
                %
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">
                Approval Rate
              </div>
            </div>
            <div className="text-center p-4 sm:p-6 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                {totalProjects || 0}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                Total Projects
              </div>
            </div>
            <div className="text-center p-4 sm:p-6 bg-purple-50 dark:bg-purple-950 rounded-lg">
              <div className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
                {pendingCreators || 0}
              </div>
              <div className="text-sm text-purple-700 dark:text-purple-300">
                Needs Review
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
