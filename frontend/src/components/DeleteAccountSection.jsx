import { useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2Icon } from "lucide-react";
import toast from "react-hot-toast";

import { deleteMyAccount } from "../lib/api";
import { disconnectChatSocket } from "../lib/chatSocket";
import { useTranslation } from "../languages/useTranslation";
import PasswordInput from "./PasswordInput";

// "Delete account" card with a password-confirmed dialog (right to erasure).
const DeleteAccountSection = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");

  const { mutate, isPending, error, reset } = useMutation({
    mutationFn: deleteMyAccount,
    onSuccess: () => {
      toast.success(t("accountDeletion.success"));
      disconnectChatSocket();
      queryClient.setQueryData(["authUser"], null);
      queryClient.clear();
      window.location.assign("/login");
    },
  });

  const close = () => {
    if (isPending) return;
    setOpen(false);
    setPassword("");
    reset();
  };

  return (
    <div className="card bg-base-200 shadow-xl border border-error/30">
      <div className="card-body space-y-3">
        <h3 className="text-lg font-semibold text-error">{t("accountDeletion.title")}</h3>
        <p className="text-sm opacity-70">{t("accountDeletion.description")}</p>
        <button
          type="button"
          className="btn btn-error btn-outline w-fit"
          onClick={() => setOpen(true)}
        >
          <Trash2Icon className="size-4" />
          {t("accountDeletion.open")}
        </button>
      </div>

      {open &&
        createPortal(
          <div className="modal modal-open" role="dialog" aria-modal="true">
            <form
              className="modal-box max-w-md"
              onSubmit={(event) => {
                event.preventDefault();
                if (password) mutate(password);
              }}
            >
              <h3 className="font-semibold text-lg text-error">
                {t("accountDeletion.confirmTitle")}
              </h3>
              <p className="text-sm opacity-80 mt-2">{t("accountDeletion.confirmText")}</p>
              <label className="form-control mt-4">
                <span className="label-text mb-1">{t("accountDeletion.passwordLabel")}</span>
                <PasswordInput
                  className="input input-bordered"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  autoFocus
                  required
                />
              </label>
              {error && (
                <div className="alert alert-error text-sm py-2 mt-3" role="alert">
                  <span>{error.response?.data?.message || t("accountDeletion.error")}</span>
                </div>
              )}
              <div className="modal-action">
                <button type="button" className="btn btn-ghost" onClick={close} disabled={isPending}>
                  {t("accountDeletion.cancel")}
                </button>
                <button type="submit" className="btn btn-error" disabled={isPending || !password}>
                  {isPending ? t("accountDeletion.deleting") : t("accountDeletion.confirm")}
                </button>
              </div>
            </form>
            <div className="modal-backdrop" onClick={close} />
          </div>,
          document.body
        )}
    </div>
  );
};

export default DeleteAccountSection;
