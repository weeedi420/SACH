import { Link, useLocation } from "react-router-dom";
import { Moon, Sun, Search, Newspaper, Globe, Send, Info, Home, BarChart3, PieChart, Brain, LogIn, LogOut, Bookmark, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { SearchOverlay } from "@/components/news/SearchOverlay";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { label: "Feed", path: "/", icon: Home },
  { label: "Transparency", path: "/transparency", icon: Globe },
  { label: "Sources", path: "/sources", icon: Newspaper },
  { label: "Trending", path: "/trending", icon: BarChart3 },
  { label: "My Bias", path: "/my-bias", icon: PieChart },
  { label: "Bookmarks", path: "/bookmarks", icon: Bookmark },
  { label: "Research", path: "/research", icon: Brain },
  { label: "Submit", path: "/submit", icon: Send },
  { label: "About", path: "/about", icon: Info },
];

// Bottom tab bar items (5 max for mobile)
const bottomTabs = [
  { label: "Feed", path: "/", icon: Home },
  { label: "Trending", path: "/trending", icon: BarChart3 },
  { label: "Sources", path: "/sources", icon: Newspaper },
  { label: "Bookmarks", path: "/bookmarks", icon: Bookmark },
  { label: "More", path: "/about", icon: Info },
];

export function Navbar() {
  const location = useLocation();
  const [dark, setDark] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-lg">
        <div className="container flex h-14 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg tracking-tight shrink-0">
            <Newspaper className="h-5 w-5 text-primary" />
            <span className="flex items-baseline gap-1.5">Sachhh <span className="font-urdu text-xs text-muted-foreground">سچ</span></span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => setSearchOpen(true)}>
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setDark(!dark)} className="text-muted-foreground">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {/* Auth button - desktop */}
            <div className="hidden md:flex items-center">
              {user ? (
                <Button variant="ghost" size="sm" className="text-muted-foreground gap-1 text-xs" onClick={signOut}>
                  <LogOut className="h-3.5 w-3.5" /> Sign Out
                </Button>
              ) : (
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-muted-foreground gap-1 text-xs">
                    <LogIn className="h-3.5 w-3.5" /> Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t safe-area-bottom">
        <div className="flex items-center justify-around h-14">
          {bottomTabs.map((tab) => {
            const isActive = tab.path === "/" 
              ? location.pathname === "/" 
              : location.pathname.startsWith(tab.path);
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <SearchOverlay open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
