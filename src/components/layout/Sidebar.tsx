import { NavLink, Link, useNavigate } from "react-router";
import { ChevronLeft, ChevronRight, X, LogOut } from "lucide-react";
import { navigation } from "../../app/navigation";
import { BrandLogo_white } from "../ui/BrandLogo";
import { logoutAdmin } from "../../lib/api";
export function Sidebar({
  collapsed,
  onCollapse,
  onClose,
}: {
  collapsed: boolean;
  onCollapse: () => void;
  onClose?: () => void;
}) {
  const navigate = useNavigate();
  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="brand">
        <Link to="/" aria-label="ECR ana sayfa" onClick={onClose}>
          <BrandLogo_white />
        </Link>
        <span className="brand-caption">İşe Alım</span>
        {onClose && (
          <button
            type="button"
            className="icon-button mobile-close"
            aria-label="Menüyü kapat"
            onClick={onClose}
          >
            <X />
          </button>
        )}
      </div>
      <div className="sidebar-controls">
        <button
          className="collapse-button"
          type="button"
          onClick={onCollapse}
          aria-label={collapsed ? "Menüyü genişlet" : "Menüyü daralt"}
          aria-expanded={!collapsed}
          aria-controls={onClose ? "mobile-sidebar-navigation" : "desktop-sidebar-navigation"}
          title={collapsed ? "Menüyü genişlet" : "Menüyü daralt"}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          <span>{collapsed ? "Menüyü Genişlet" : "Menüyü Daralt"}</span>
        </button>
      </div>
      <nav id={onClose ? "mobile-sidebar-navigation" : "desktop-sidebar-navigation"} aria-label="Ana menü">
        {navigation.map(({ path, label, icon: Icon, category }, index) => (
          <div key={path}>
          {(index === 0 || navigation[index - 1].category !== category) && <p className="nav-heading">{category}</p>}
          <NavLink
            to={path}
            end={path === "/" || path === "/adaylar"}
            onClick={onClose}
            aria-label={label}
            title={label}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <Icon size={19} />
            <span>{label}</span>
          </NavLink>
          </div>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <button className="nav-item" type="button" title="Çıkış yap" onClick={() => { void logoutAdmin().finally(() => navigate("/login", { replace: true })); }}>
          <LogOut size={19} />
          <span>Çıkış yap</span>
        </button>
      </div>
    </aside>
  );
}
