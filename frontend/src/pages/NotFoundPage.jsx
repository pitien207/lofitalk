import { Link } from "react-router";
import { CompassIcon } from "lucide-react";
import { useTranslation } from "../languages/useTranslation";

const NotFoundPage = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="text-center space-y-3 max-w-md">
        <CompassIcon className="size-14 mx-auto text-primary opacity-80" />
        <h1 className="text-3xl font-bold">404</h1>
        <p className="text-lg font-semibold">{t("notFound.title")}</p>
        <p className="opacity-70">{t("notFound.description")}</p>
        <Link to="/" className="btn btn-primary mt-2">
          {t("notFound.home")}
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
