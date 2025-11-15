import { SmartphoneIcon } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "../languages/useTranslation";
import qrAndroid from "../pictures/others/QR_Android_App.png";

const MobileAppPage = () => {
  const { t } = useTranslation();

  const featuresRaw = t("mobileAppPage.features");
  const features = useMemo(
    () => (Array.isArray(featuresRaw) ? featuresRaw : []),
    [featuresRaw]
  );

  const stepsRaw = t("mobileAppPage.steps");
  const steps = useMemo(() => (Array.isArray(stepsRaw) ? stepsRaw : []), [stepsRaw]);

  return (
    <div className="w-full">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
        <section className="rounded-3xl border border-base-300 bg-base-100/80 p-8 shadow-xl space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            <SmartphoneIcon className="size-4" />
            {t("mobileAppPage.heroBadge")}
          </span>
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-base-content">{t("mobileAppPage.heroTitle")}</h1>
            <p className="text-base text-base-content/80">{t("mobileAppPage.heroSubtitle")}</p>
          </div>
          <p className="text-sm text-base-content/70 rounded-2xl border border-base-300 bg-base-100/80 px-4 py-2">
            {t("mobileAppPage.availabilityNote")}
          </p>
        </section>

        <section className="rounded-3xl border border-base-300 bg-base-100/90 p-6 shadow flex flex-col items-center gap-4">
          <h2 className="text-xl font-semibold text-base-content">{t("mobileAppPage.qrTitle")}</h2>
          <img
            src={qrAndroid}
            alt="Android APK QR code"
            className="w-52 max-w-full rounded-2xl border border-base-300 bg-base-100 p-4"
          />
          <p className="text-center text-sm text-base-content/70">{t("mobileAppPage.qrDescription")}</p>
        </section>

        <section className="grid gap-6 rounded-3xl border border-base-300 bg-base-100/90 p-6 shadow">
          <h2 className="text-xl font-semibold text-base-content">{t("mobileAppPage.featuresTitle")}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className="rounded-2xl border border-base-200 bg-base-100/80 p-4 shadow-inner flex flex-col gap-3"
              >
                <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="text-sm text-base-content/80">{feature}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-base-300 bg-base-100/90 p-6 shadow space-y-4">
          <h2 className="text-xl font-semibold text-base-content">{t("mobileAppPage.stepsTitle")}</h2>
          <ol className="space-y-3">
            {steps.map((step, index) => (
              <li key={index} className="flex items-start gap-4">
                <span className="mt-1 flex size-7 items-center justify-center rounded-full bg-secondary/10 text-xs font-semibold text-secondary">
                  {index + 1}
                </span>
                <p className="text-base text-base-content/80">{step}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
};

export default MobileAppPage;
