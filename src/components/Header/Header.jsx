// src/components/Header/Header.jsx
import { useHeaderViewModel } from "./hooks/useHeaderViewModel";
import NavBar from "./components/NavBar";
import StreakPill from "./components/StreakPill";
import UserMenu from "./components/UserMenu";
import CoinDisplay from "./components/CoinDisplay";

export default function Header(props) {
  const vm = useHeaderViewModel(props);

  return (
    <header className="sticky top-0 z-[1000] border-b border-base-300 bg-base-100/85 px-3 shadow-md backdrop-blur-xl backdrop-saturate-[120%] sm:px-4">
      <div className="mx-auto flex min-h-[56px] max-w-[500px] items-center justify-between gap-2.5 py-2.5">
        <NavBar
          currentScreen={vm.currentScreen}
          onNavigate={vm.onNavigate}
          isActive={vm.isActive}
          accent={vm.accent}
          quizVariant={vm.quizVariant}
        />

        <div className="flex shrink-0 items-center gap-2">
          <CoinDisplay userId={vm.user?.id} />
          <StreakPill days={vm.streakDays} />
          <UserMenu
            menuOpen={vm.menuOpen}
            setMenuOpen={vm.setMenuOpen}
            menuRef={vm.menuRef}
            displayName={vm.displayName}
            user={vm.user}
            userLevel={vm.userLevel}
            roleLabel={vm.roleLabel}
            isAdmin={vm.isAdmin}
            theme={vm.theme}
            toggleTheme={vm.toggleTheme}
            isActive={vm.isActive}
            goToStats={vm.goToStats}
            goToAdmin={vm.goToAdmin}
            handleLogout={vm.handleLogout}
          />
        </div>
      </div>
    </header>
  );
}