import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImageIcon, LoaderIcon, UploadIcon } from "lucide-react";
import toast from "react-hot-toast";

import { uploadAvatar } from "../lib/api";
import { useTranslation } from "../languages/useTranslation";
import {
  AVATAR_FILE_ACCEPT,
  AvatarPrepareError,
  prepareAvatarUpload,
} from "../utils/avatarImage";

// "Upload photo" button + preview dialog. The new picture is saved on the server
// immediately; onUploaded(profilePicUrl) lets the page update its form state.
const AvatarUploader = ({ onUploaded, buttonClassName = "btn btn-outline btn-sm" }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const inputRef = useRef(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [prepared, setPrepared] = useState(null); // { blob, fileName, previewUrl }
  const [errorMessage, setErrorMessage] = useState("");

  const releasePreview = (item) => {
    if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
  };

  useEffect(() => () => releasePreview(prepared), [prepared]);

  const closeDialog = () => {
    setPrepared(null);
    setErrorMessage("");
  };

  const describeUploadError = (error) => {
    if (!error?.response) return t("avatarUpload.errors.network");
    const code = error.response.data?.code;
    const translated = code ? t(`avatarUpload.errors.${code}`) : null;
    if (translated && translated !== `avatarUpload.errors.${code}`) return translated;
    return error.response.data?.message || t("avatarUpload.errors.generic");
  };

  const { mutate: sendAvatar, isPending: isUploading } = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (data) => {
      onUploaded?.(data.profilePic);
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      toast.success(t("avatarUpload.success"));
      closeDialog();
    },
    onError: (error) => {
      const message = describeUploadError(error);
      setErrorMessage(message);
      toast.error(message);
    },
  });

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow choosing the same file again
    if (!file) return;

    setErrorMessage("");
    setIsPreparing(true);
    try {
      setPrepared(await prepareAvatarUpload(file));
    } catch (error) {
      const message =
        error instanceof AvatarPrepareError
          ? t(`avatarUpload.errors.${error.code}`, error.vars)
          : t("avatarUpload.errors.generic");
      toast.error(message);
    } finally {
      setIsPreparing(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className={buttonClassName}
        onClick={() => inputRef.current?.click()}
        disabled={isPreparing || isUploading}
        title={t("avatarUpload.hint")}
      >
        {isPreparing ? (
          <LoaderIcon className="size-4 mr-1.5 animate-spin" />
        ) : (
          <UploadIcon className="size-4 mr-1.5" />
        )}
        {isPreparing ? t("avatarUpload.preparing") : t("avatarUpload.button")}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={AVATAR_FILE_ACCEPT}
        className="hidden"
        onChange={handleFileChange}
        data-testid="avatar-file-input"
      />

      {/* Portal to <body>: page cards create their own stacking contexts and would cover the dialog. */}
      {prepared && createPortal(
        <div className="modal modal-open" role="dialog" aria-modal="true">
          <div className="modal-box max-w-sm text-center">
            <h3 className="font-semibold text-lg">{t("avatarUpload.previewTitle")}</h3>

            <div className="flex justify-center my-5">
              <div className="size-40 rounded-full overflow-hidden ring ring-primary/40 ring-offset-2 ring-offset-base-100 bg-base-300 flex items-center justify-center">
                {prepared.previewUrl ? (
                  <img
                    src={prepared.previewUrl}
                    alt={t("avatarUpload.previewTitle")}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="size-12 opacity-40" />
                )}
              </div>
            </div>

            <p className="text-sm opacity-70">
              {prepared.previewUrl ? t("avatarUpload.previewNote") : t("avatarUpload.noPreview")}
            </p>

            {errorMessage && (
              <div className="alert alert-error mt-4 text-sm py-2" role="alert">
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="modal-action justify-center">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={closeDialog}
                disabled={isUploading}
              >
                {t("avatarUpload.cancel")}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => sendAvatar(prepared)}
                disabled={isUploading}
              >
                {isUploading && <LoaderIcon className="size-4 animate-spin" />}
                {isUploading ? t("avatarUpload.saving") : t("avatarUpload.save")}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={isUploading ? undefined : closeDialog} />
        </div>,
        document.body
      )}
    </>
  );
};

export default AvatarUploader;
