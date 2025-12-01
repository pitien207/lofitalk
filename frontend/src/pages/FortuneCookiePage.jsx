import FortuneCookie from "../components/FortuneCookie";
import { useTranslation } from "../languages/useTranslation";
import useAuthUser from "../hooks/useAuthUser";

const FortuneCookiePage = () => {
  const { t } = useTranslation();
  const { authUser } = useAuthUser();
  const stepsRaw = t("sidebar.fortune.ritualSteps");
  const steps = Array.isArray(stepsRaw) ? stepsRaw : [];
  const isAdmin = authUser?.accountType === "admin";

  // if (!isAdmin) {
  //   return (
  //     <div className="w-full">
  //       <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
  //         <section className="rounded-3xl border border-base-300 bg-base-100/80 p-8 shadow-xl text-center space-y-3">
  //           <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
  //             Fortune Cookie
  //           </p>
  //           <h1 className="text-4xl font-bold text-base-content">
  //             Coming soon
  //           </h1>
  //           <p className="text-base text-base-content/70">
  //             This feature unlocks soon.
  //           </p>
  //         </section>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="w-full">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
        <section className="rounded-3xl border border-base-300 bg-base-100/80 p-8 shadow-xl">
          <div className="space-y-3 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
              Lofi fortune ritual
            </p>
            <h1 className="text-4xl font-bold text-base-content">
              {t("sidebar.fortune.title")}
            </h1>
            <p className="text-base text-base-content/80">
              {t("sidebar.fortune.pageDescription")}
            </p>
          </div>
        </section>

        <FortuneCookie />

        {steps.length > 0 && (
          <section className="grid gap-4 rounded-3xl border border-base-300 bg-base-100/90 p-6 shadow">
            <h2 className="text-xl font-semibold text-base-content">
              {t("sidebar.fortune.linkLabel")}
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-base-200 bg-base-100/80 p-4 shadow-inner"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <p className="text-sm text-base-content/80">{step}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default FortuneCookiePage;
