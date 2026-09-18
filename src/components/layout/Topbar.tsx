import {  BrandLogo_black } from "../ui/BrandLogo";
import { Menu, Search } from "lucide-react";
import { useLocation } from "react-router";
import { navigation } from "../../app/navigation";

export function Topbar({
  onMenu,
  search,
  onSearch,
}: {
  onMenu: () => void;
  search: string;
  onSearch: (value: string) => void;
}) {
  const location = useLocation();
  const label = navigation.find((item) => item.path === location.pathname)?.label
    ?? (location.pathname.startsWith("/adaylar/") ? "Aday detayı"
      : location.pathname.startsWith("/degerlendirmeler/teknik/") ? "Teknik mülakat" : "Sayfa");

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button type="button" className="icon-button menu-toggle" aria-label="Menüyü aç" onClick={onMenu}>
          <Menu size={22} />
        </button>
        <span className="header-brand"><BrandLogo_black /></span>
        <span className="breadcrumb">Çalışma alanı <span>/</span> <strong>{label}</strong></span>
      </div>
      <div className="topbar-actions">
        <label className="global-search">
          <Search size={17} />
          <input aria-label="Aday ara" placeholder="Aday ara..." value={search} onChange={(event) => onSearch(event.target.value)} />
        </label>
      </div>
    </header>
  );
}
