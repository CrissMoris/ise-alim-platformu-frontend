import { Link } from "react-router";
import { EmptyState } from "../components/ui/EmptyState";
export function NotFoundPage() {
  return (
    <div className="not-found">
      <EmptyState
        title="Sayfa bulunamadı"
        description="Bu adres çalışma alanınızda mevcut değil."
      />
      <Link to="/" className="button primary">
        Genel bakışa dön
      </Link>
    </div>
  );
}
