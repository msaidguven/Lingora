// src/components/Header/Header.jsx
// View katmanı: state/mantık burada YOK. Sadece useHeaderViewModel'den
// gelen verileri alt component'lere dağıtıp ekrana basıyor.

import { useHeaderViewModel } from "./hooks/useHeaderViewModel";
import NavBar from "./components/NavBar";
import StreakPill from "./components/StreakPill";
import UserMenu from "./components/UserMenu";
import "./Header.css";

export default function Header(props) {
  const vm = useHeaderViewModel(props);

  return (
    <header className="header-wrapper" data-theme={vm.theme}>
      <div className="header-glow" />

      <div className="header-bar">
        <NavBar
          currentScreen={vm.currentScreen}
          onNavigate={vm.onNavigate}
          isActive={vm.isActive}
          accent={vm.accent}
          quizVariant={vm.quizVariant}
        />

        <div className="header-right">
          <StreakPill days={vm.streakDays} />

          <UserMenu
            menuOpen={vm.menuOpen}
            setMenuOpen={vm.setMenuOpen}
            menuRef={vm.menuRef}
            displayName={vm.displayName}
            user={vm.user}
            userLevel={vm.userLevel}
            accent={vm.accent}
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
