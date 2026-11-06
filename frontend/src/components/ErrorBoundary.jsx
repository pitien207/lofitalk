import { Component } from "react";
import { AlertTriangleIcon } from "lucide-react";
import { useTranslation } from "../languages/useTranslation";

const ErrorFallback = ({ onRetry }) => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="card bg-base-200 shadow-xl max-w-md w-full">
        <div className="card-body items-center text-center gap-3">
          <AlertTriangleIcon className="size-12 text-warning" />
          <h1 className="text-xl font-semibold">{t("errorPage.title")}</h1>
          <p className="opacity-70">{t("errorPage.description")}</p>
          <div className="flex gap-2 mt-2">
            <button type="button" className="btn btn-primary" onClick={onRetry}>
              {t("errorPage.reload")}
            </button>
            <a href="/" className="btn btn-ghost">
              {t("errorPage.home")}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

// Catches render errors anywhere below so one broken component doesn't blank the whole app.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("UI error:", error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onRetry={() => window.location.reload()} />;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
