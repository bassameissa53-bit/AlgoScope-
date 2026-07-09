import { ReactNode } from "react";
import { MobileNav } from "./MobileNav";
import { AppHeader } from "./AppHeader";

interface AppLayoutProps {
  children: ReactNode;
  showNav?: boolean;
  headerRight?: ReactNode;
}

export function AppLayout({ children, showNav = true, headerRight }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background max-w-[430px] mx-auto relative">
      <AppHeader rightContent={headerRight} />
      <main className={showNav ? "pb-20" : ""}>
        {children}
      </main>
      {showNav && <MobileNav />}
    </div>
  );
}
