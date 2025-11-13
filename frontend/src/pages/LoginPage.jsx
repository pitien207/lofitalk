import { useState } from "react";
import { ShipWheelIcon } from "lucide-react";
import { Link } from "react-router";
import useLogin from "../hooks/useLogin";
import { useTranslation } from "../languages/useTranslation";
import LanguageSelector from "../components/LanguageSelector";
import {
  requestPasswordReset,
  resetPasswordWithCode,
} from "../lib/api";

const LoginPage = () => {
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState("request");
  const [resetForm, setResetForm] = useState({
    email: "",
    code: "",
    newPassword: "",
  });
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  const { isPending, error, loginMutation } = useLogin();
  const { t } = useTranslation();

  const handleLogin = (e) => {
    e.preventDefault();
    loginMutation(loginData);
  };

  const openForgotModal = () => {
    setResetForm((prev) => ({
      ...prev,
      email: loginData.email || prev.email,
    }));
    setForgotStep("request");
    setResetError("");
    setResetMessage("");
    setForgotOpen(true);
  };

  const closeForgotModal = () => {
    setForgotOpen(false);
    setResetLoading(false);
  };

  const handleSendResetCode = async (e) => {
    e.preventDefault();
    setResetError("");
    setResetMessage("");

    if (!resetForm.email) {
      setResetError("Please enter your email address.");
      return;
    }

    setResetLoading(true);
    try {
      await requestPasswordReset({ email: resetForm.email });
      setResetMessage("Verification code sent. Please check your inbox.");
      setForgotStep("verify");
    } catch (err) {
      setResetError(
        err?.response?.data?.message ||
          "Unable to send reset code. Please try again."
      );
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError("");
    setResetMessage("");

    if (!resetForm.code || !resetForm.newPassword) {
      setResetError("Please enter the code and your new password.");
      return;
    }

    setResetLoading(true);
    try {
      await resetPasswordWithCode({
        email: resetForm.email,
        code: resetForm.code,
        newPassword: resetForm.newPassword,
      });
      setResetMessage("Password updated! You can now sign in.");
      setForgotStep("done");
      setLoginData((prev) => ({
        ...prev,
        email: resetForm.email,
        password: "",
      }));
      setResetForm((prev) => ({ ...prev, code: "", newPassword: "" }));
    } catch (err) {
      setResetError(
        err?.response?.data?.message ||
          "Unable to reset password. Please try again."
      );
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div
      className="h-screen flex items-center justify-center p-4 sm:p-6 md:p-8"
      data-theme="forest"
    >
      <div className="border border-primary/25 flex flex-col lg:flex-row w-full max-w-5xl mx-auto bg-base-100 rounded-xl shadow-lg overflow-hidden">
        {/* LOGIN FORM SECTION */}
        <div className="w-full lg:w-1/2 p-4 sm:p-8 flex flex-col">
          {/* LOGO + LANGUAGE */}
          <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
            <div className="flex items-center gap-2">
              <ShipWheelIcon className="size-9 text-primary" />
              <span className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-[#FF5E5E] to-[#FF9A9A] tracking-wider">
                LofiTalk
              </span>
            </div>
            <LanguageSelector />
          </div>

          {/* ERROR MESSAGE DISPLAY */}
          {error && (
            <div className="alert alert-error mb-4">
              <span>{error.response.data.message}</span>
            </div>
          )}

          <div className="w-full">
            <form onSubmit={handleLogin}>
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold">
                    {t("auth.loginTitle")}
                  </h2>
                  <p className="text-sm opacity-70">
                    {t("auth.loginSubtitle")}
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="form-control w-full space-y-2">
                    <label className="label">
                      <span className="label-text">{t("auth.email")}</span>
                    </label>
                    <input
                      type="email"
                      placeholder="hello@example.com"
                      className="input input-bordered w-full"
                      value={loginData.email}
                      onChange={(e) =>
                        setLoginData({ ...loginData, email: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="form-control w-full space-y-2">
                    <label className="label">
                      <span className="label-text">{t("auth.password")}</span>
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="input input-bordered w-full"
                      value={loginData.password}
                      onChange={(e) =>
                        setLoginData({ ...loginData, password: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="text-right">
                    <button
                      type="button"
                      className="text-primary text-sm hover:underline"
                      onClick={openForgotModal}
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-full"
                    disabled={isPending}
                  >
                    {isPending ? (
                      <>
                        <span className="loading loading-spinner loading-xs"></span>
                        {t("common.loading")}
                      </>
                    ) : (
                      t("auth.signInButton")
                    )}
                  </button>

                  <div className="text-center mt-4">
                    <p className="text-sm">
                      {t("auth.dontHaveAccount")}
                      <Link
                        to="/signup"
                        className="text-primary hover:underline"
                      >
                        {t("auth.createOne")}
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* IMAGE SECTION */}
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
              <p className="opacity-70">
                {t("auth.signupIllustrationSubtitle")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {forgotOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-base-100 rounded-xl w-full max-w-md p-6 relative shadow-2xl border border-primary/20">
            <button
              className="btn btn-sm btn-ghost absolute right-4 top-4"
              onClick={closeForgotModal}
            >
              ✕
            </button>
            <h2 className="text-2xl font-semibold mb-2">Reset password</h2>
            <p className="text-sm opacity-70 mb-4">
              Enter your email to receive a verification code. Once verified, you
              can set a new password.
            </p>

            {resetError && (
              <div className="alert alert-error mb-4">
                <span>{resetError}</span>
              </div>
            )}
            {resetMessage && (
              <div className="alert alert-success mb-4">
                <span>{resetMessage}</span>
              </div>
            )}

            {forgotStep !== "done" ? (
              <form
                onSubmit={
                  forgotStep === "request"
                    ? handleSendResetCode
                    : handleResetPassword
                }
                className="space-y-4"
              >
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Email</span>
                  </label>
                  <input
                    type="email"
                    className="input input-bordered"
                    value={resetForm.email}
                    onChange={(e) =>
                      setResetForm({ ...resetForm, email: e.target.value })
                    }
                    required
                    disabled={forgotStep !== "request"}
                  />
                </div>

                {forgotStep === "verify" && (
                  <>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Verification code</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered"
                        value={resetForm.code}
                        onChange={(e) =>
                          setResetForm({ ...resetForm, code: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">New password</span>
                      </label>
                      <input
                        type="password"
                        className="input input-bordered"
                        value={resetForm.newPassword}
                        onChange={(e) =>
                          setResetForm({
                            ...resetForm,
                            newPassword: e.target.value,
                          })
                        }
                        required
                        minLength={6}
                      />
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={resetLoading}
                >
                  {resetLoading && (
                    <span className="loading loading-spinner loading-xs"></span>
                  )}
                  {forgotStep === "request"
                    ? "Send verification code"
                    : "Update password"}
                </button>
              </form>
            ) : (
              <button
                className="btn btn-outline w-full mt-4"
                onClick={closeForgotModal}
              >
                Back to login
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default LoginPage;
