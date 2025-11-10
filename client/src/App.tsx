import { Switch, Route, useLocation, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BarChart3, MessageSquare, TrendingUp } from "lucide-react";
import Dashboard from "@/pages/dashboard";
import ChatWithData from "@/pages/chat";
import NotFound from "@/pages/not-found";

function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    {
      path: "/",
      label: "Dashboard",
      icon: BarChart3,
      testId: "nav-dashboard"
    },
    {
      path: "/chat",
      label: "Chat with Data",
      icon: MessageSquare,
      testId: "nav-chat"
    }
  ];

  return (
    <div className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo / Brand */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary">
            <TrendingUp className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-sidebar-foreground">
              QualityAnalytics
            </h1>
            <p className="text-xs text-muted-foreground">Invoice Management</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;

          return (
            <Link key={item.path} href={item.path}>
              <div
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium
                  transition-colors hover-elevate active-elevate-2 cursor-pointer
                  ${isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground'
                  }
                `}
                data-testid={item.testId}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <p className="text-xs text-muted-foreground text-center">
          v1.0.0 • Powered by Vanna AI
        </p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/chat" component={ChatWithData} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="flex h-screen overflow-hidden bg-background">
          {/* Sidebar */}
          <Sidebar />

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            <Router />
          </div>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
