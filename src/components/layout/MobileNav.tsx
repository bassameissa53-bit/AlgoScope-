import { Crosshair, GraduationCap, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

// Pages where the bottom nav should NOT appear (public pages)
const PUBLIC_PAGES = ["/", "/auth", "/plans", "/contact"];

export function MobileNav() {
  const location = useLocation();
  const { t } = useLanguage();

  // Hide nav on public pages
  if (PUBLIC_PAGES.some((p) => location.pathname === p || location.pathname.startsWith(p))) {
    return null;
  }

  const items = [
    { icon: Crosshair, labelKey: "nav.analysis", path: "/dashboard" },
    { icon: GraduationCap, labelKey: "nav.academy", path: "/academy" },
    { icon: User, labelKey: "nav.profile", path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass glass-nav rounded-none border-t">
      <div className="flex items-center justify-around py-2 px-2 max-w-[430px] mx-auto">
        {items.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path === "/academy" && location.pathname.startsWith("/academy"));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 px-5 py-2 rounded-2xl transition-all duration-200 active:scale-95",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-all",
                  isActive && "drop-shadow-[0_0_10px_hsl(var(--primary))]"
                )}
              />
              <span className="text-[10px] font-medium tracking-wider uppercase">
                {t(item.labelKey)}
              </span>
              <span
                className={cn(
                  "h-1 w-1 rounded-full transition-all",
                  isActive ? "bg-primary shadow-[0_0_6px_hsl(var(--primary))]" : "bg-transparent"
                )}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
