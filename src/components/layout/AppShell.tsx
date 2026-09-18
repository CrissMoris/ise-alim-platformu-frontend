import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { getCandidates, getPositions } from "../../lib/api";
import type { Candidate, Position, RecruitmentContext } from "../../types/recruitment";

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState("");
  const [positions, setPositions] = useState<Position[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState(false);

  const dialog = useRef<HTMLDialogElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (mobile) dialog.current?.showModal();
    else dialog.current?.close();
  }, [mobile]);

  useEffect(() => {
    Promise.all([getPositions(), getCandidates()])
      .then(([nextPositions, nextCandidates]) => {
        setPositions(nextPositions);
        setCandidates(nextCandidates);
      })
      .catch(() => setDataError(true))
      .finally(() => setDataLoading(false));
  }, []);

  useEffect(() => {
    const refresh = () => { getCandidates().then(setCandidates).catch(() => setDataError(true)); };
    window.addEventListener("candidates-updated", refresh);
    return () => window.removeEventListener("candidates-updated", refresh);
  }, []);

  const context: RecruitmentContext = {
    search,
    candidates,
    positions,
    dataLoading,
    dataError,
  };

  return (
    <div className={`app-shell ${collapsed ? "sidebar-is-collapsed" : ""}`}>
      <a className="skip-link" href="#main-content">
        İçeriğe geç
      </a>

      <div className="desktop-sidebar">
        <Sidebar
          collapsed={collapsed}
          onCollapse={() => setCollapsed(!collapsed)}
        />
      </div>

      <dialog
        ref={dialog}
        className="mobile-drawer"
        aria-label="Gezinme menüsü"
        onCancel={() => setMobile(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setMobile(false);
        }}
      >
        <Sidebar
          collapsed={false}
          onCollapse={() => setMobile(false)}
          onClose={() => setMobile(false)}
        />
      </dialog>

      <div className="app-main">
        <Topbar
          onMenu={() => setMobile(true)}
          search={search}
          onSearch={(value) => {
            setSearch(value);

            if (
              !["/", "/adaylar"].includes(location.pathname)
            ) {
              navigate("/adaylar");
            }
          }}
        />

        <main id="main-content" tabIndex={-1}>
          <Outlet context={context} />
        </main>

        <footer className="page-footer">
          <span>© 2026 ECR</span>
          <span>İşe alım çalışma alanı</span>
        </footer>
      </div>
    </div>
  );
}
