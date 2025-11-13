import { useState } from "react";
import { MailCheckIcon, ShipWheelIcon } from "lucide-react";
import { Link, useNavigate } from "react-router";

import useSignUp from "../hooks/useSignup.js";
import useVerifySignup from "../hooks/useVerifySignup.js";
import { useTranslation } from "../languages/useTranslation";
import LanguageSelector from "../components/LanguageSelector";

const SignUpPage = () => {
  const [signupData, setSignupData] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [step, setStep] = useState("form");
  const [pendingEmail, setPendingEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  // This is how we did it at first, without using our custom hook
  // const queryClient = useQueryClient();
  // const {
  //   mutate: signupMutation,
  //   isPending,
  //   error,
  // } = useMutation({
  //   mutationFn: signup,
  //   onSuccess: () => queryClient.invalidateQueries({ queryKey: ["authUser"] }),
  // });

  // This is how we did it using our custom hook - optimized version
  const { isPending, error, signupMutation } = useSignUp();
  const { verifySignupMutation, isVerifying, verifyError } = useVerifySignup();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSignup = (e) => {
    e.preventDefault();
    setInfoMessage("");
    signupMutation(signupData, {
      onSuccess: (data) => {
        setPendingEmail(signupData.email);
        setStep("verify");
        setInfoMessage(data?.message || t("auth.verificationEmailSent"));
      },
    });
  };

  const handleVerification = (e) => {
    e.preventDefault();
    if (!pendingEmail) return;

    verifySignupMutation(
      {
        email: pendingEmail,
        code: verificationCode.trim(),
      },
      {
        onSuccess: () => {
          setInfoMessage(t("auth.verificationSuccess"));
          navigate("/onboarding");
        },
      }
    );
  };

  const handleBackToForm = () => {
    setStep("form");
    setVerificationCode("");
    setInfoMessage("");
  };

  return (
    <div
      className="h-screen flex items-center justify-center p-4 sm:p-6 md:p-8"
      data-theme="forest"
    >
      <div className="border border-primary/25 flex flex-col lg:flex-row w-full max-w-5xl mx-auto bg-base-100 rounded-xl shadow-lg overflow-hidden">
        <div className="w-full lg:w-1/2 p-4 sm:p-8 flex flex-col">
          <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
            <div className="flex items-center gap-2">
              <ShipWheelIcon className="size-9 text-primary" />
              <span className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-[#FF5E5E] to-[#FF9A9A] tracking-wider">
                LofiTalk
              </span>
            </div>
            <LanguageSelector />
          </div>
          <p className="text-sm opacity-70">{t("auth.signupLogoTagline")}</p>

          {step === "form" ? (
            <>
              {error && (
                <div className="alert alert-error mb-4">
                  <span>{error.response?.data?.message}</span>
                </div>
              )}

              <div className="w-full">
                <form onSubmit={handleSignup}>
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl font-semibold">
                        {t("auth.signupTitle")}
                      </h2>
                      <p className="text-sm opacity-70">
                        {t("auth.signupSubtitle")}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="form-control w-full">
                        <label className="label">
                          <span className="label-text">
                            {t("auth.fullName")}
                          </span>
                        </label>
                        <input
                          type="text"
                          placeholder="John Doe"
                          className="input input-bordered w-full"
                          value={signupData.fullName}
                          onChange={(e) =>
                            setSignupData({
                              ...signupData,
                              fullName: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="form-control w-full">
                        <label className="label">
                          <span className="label-text">{t("auth.email")}</span>
                        </label>
                        <input
                          type="email"
                          placeholder="john@gmail.com"
                          className="input input-bordered w-full"
                          value={signupData.email}
                          onChange={(e) =>
                            setSignupData({
                              ...signupData,
                              email: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="form-control w-full">
                        <label className="label">
                          <span className="label-text">
                            {t("auth.password")}
                          </span>
                        </label>
                        <input
                          type="password"
                          placeholder="********"
                          className="input input-bordered w-full"
                          value={signupData.password}
                          onChange={(e) =>
                            setSignupData({
                              ...signupData,
                              password: e.target.value,
                            })
                          }
                          required
                        />
                        <p className="text-xs opacity-70 mt-1">
                          {t("auth.passwordHint")}
                        </p>
                      </div>

                      <div className="form-control">
                        <label className="label cursor-pointer justify-start gap-2">
                          <input
                            type="checkbox"
                            className="checkbox checkbox-sm"
                            required
                          />
                          <span className="text-xs leading-tight">
                            {t("auth.termsPrefix")}{" "}
                            <span className="text-primary hover:underline">
                              {t("auth.termsOfService")}
                            </span>{" "}
                            {t("auth.and")}{" "}
                            <span className="text-primary hover:underline">
                              {t("auth.privacyPolicy")}
                            </span>
                          </span>
                        </label>
                      </div>
                    </div>

                    <button className="btn btn-primary w-full" type="submit">
                      {isPending ? (
                        <>
                          <span className="loading loading-spinner loading-xs"></span>
                          {t("common.loading")}
                        </>
                      ) : (
                        t("auth.createAccount")
                      )}
                    </button>

                    <div className="text-center mt-4">
                      <p className="text-sm">
                        {t("auth.alreadyHaveAccount")}
                        <Link
                          to="/login"
                          className="text-primary hover:underline"
                        >
                          {t("auth.signIn")}
                        </Link>
                      </p>
                    </div>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {infoMessage && (
                <div className="rounded-2xl border border-primary/30 bg-gradient-to-r from-[#FF5E5E]/10 to-[#FF9A9A]/10 px-3 py-2 flex items-center gap-2 text-xs sm:text-sm">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-primary">
                    <MailCheckIcon className="size-4" />
                  </span>
                  <span className="text-base-content/90 leading-tight">
                    {infoMessage}
                  </span>
                </div>
              )}
              {verifyError && (
                <div className="alert alert-error">
                  <span>{verifyError.response?.data?.message}</span>
                </div>
              )}
              <div>
                <h2 className="text-xl font-semibold">
                  {t("auth.verificationTitle")}
                </h2>
                <p className="text-sm opacity-70">
                  {t("auth.verificationSubtitle", { email: pendingEmail })}
                </p>
              </div>
              <form onSubmit={handleVerification} className="space-y-3">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">
                      {t("auth.verificationCodeLabel")}
                    </span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    className="input input-bordered tracking-widest text-center text-lg"
                    value={verificationCode}
                    onChange={(e) =>
                      setVerificationCode(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="123456"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={isVerifying || verificationCode.length < 6}
                >
                  {isVerifying ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      {t("common.loading")}
                    </>
                  ) : (
                    t("auth.verificationSubmit")
                  )}
                </button>
              </form>
              <button
                type="button"
                className="btn btn-ghost btn-sm w-fit"
                onClick={handleBackToForm}
              >
                {t("auth.verificationBack")}
              </button>
              <p className="text-xs opacity-70">
                {t("auth.verificationResendHint")}
              </p>
            </div>
          )}
        </div>

        {/* SIGNUP FORM - RIGHT SIDE */}
        <div className="hidden lg:flex w-full lg:w-1/2 bg-primary/10 items-center justify-center">
          <div className="max-w-md p-8">
            {/* Illustration */}
            <div className="relative aspect-square max-w-sm mx-auto">
              <img
                src="/i.png"
                alt="Language connection illustration"
                className="w-full h-full"
              />
            </div>

            <div className="text-center space-y-3 mt-6">
              <h2 className="text-xl font-semibold">
                {t("auth.signupIllustrationTitle")}
              </h2>
              <p className="opacity-70">{t("auth.signupIllustrationSubtitle")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
