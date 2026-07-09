import logoImg from "@/assets/logo.png";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

interface AppHeaderProps {
  showLanguageSwitcher?: boolean;
  rightContent?: React.ReactNode;
}

export function AppHeader({ showLanguageSwitcher = true, rightContent }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full glass glass-nav rounded-none border-x-0 border-t-0">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <img src={logoImg} alt="AlgoScope" className="w-8 h-8 object-contain drop-shadow-[0_0_10px_hsl(var(--primary)/0.5)]" />
          <span className="font-display text-sm font-bold gold-text tracking-[0.18em]">
            ALGOSCOPE
          </span>
        </div>
        <div className="flex items-center gap-1">
          {showLanguageSwitcher && <LanguageSwitcher />}
          {rightContent}
        </div>
      </div>
    </header>
  );
}
