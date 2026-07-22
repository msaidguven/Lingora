// src/components/Header/Header.jsx
import { useHeaderViewModel } from "./hooks/useHeaderViewModel";
import NavBar from "./components/NavBar";
import UserMenu from "./components/UserMenu";
import CoinDisplay from "./components/CoinDisplay";
import { NotebookTheme } from "../../theme/notebook";

// Header, defterin sırtı/kapağı gibi davranıyor — sabit lacivert (--lg-cover),
// üstünde ince spiral delik şeridi. Anasayfa/İstatistik sayfalarının en
// üstündeki <SpiralStrip /> ile aynı motif; Header her sayfada zaten en üstte
// olduğu için o sayfalardaki spiral şeridi kaldırmak istersen kaldırabilirsin
// (aynı görsel artık burada da var, iki kere tekrar etmesin diye).
export default function Header(props) {
  const vm = useHeaderViewModel(props);

  return (
    <header className="lg-notebook sticky top-0 z-[1000] bg-[var(--lg-cover)] shadow-md">
      <NotebookTheme />

      {/* İnce spiral cilt şeridi */}
      <div
        className="h-[6px] w-full bg-[length:22px_10px] bg-[position:11px_0]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.35) 2.5px, transparent 2.5px)",
        }}
      />

      <div className="mx-auto flex min-h-[54px] max-w-[500px] items-end justify-between gap-2 px-3 pt-2 sm:px-4">
        <NavBar
          currentScreen={vm.currentScreen}
          onNavigate={vm.onNavigate}
          isActive={vm.isActive}
          accent={vm.accent}
          quizVariant={vm.quizVariant}
        />

        <div className="flex shrink-0 items-center gap-2 pb-2">
          <CoinDisplay userId={vm.user?.id} />
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
            handleLogout={vm.handleLogout}
            streakDays={vm.streakDays}
          />
        </div>
      </div>
    </header>
  );
}