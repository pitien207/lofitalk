import { useState } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useTranslation } from "../languages/useTranslation";

// Password field with a show/hide toggle. Accepts the same props as <input>.
const PasswordInput = ({ className = "", wrapperClassName = "", ...props }) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const label = visible ? t("passwordField.hide") : t("passwordField.show");

  return (
    <div className={`relative ${wrapperClassName}`}>
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={`${className} w-full pr-12`}
        autoCapitalize="off"
        spellCheck={false}
      />
      <button
        type="button"
        className="btn btn-ghost btn-sm btn-circle absolute right-2 top-1/2 -translate-y-1/2"
        onClick={() => setVisible((value) => !value)}
        aria-label={label}
        aria-pressed={visible}
        title={label}
      >
        {visible ? (
          <EyeOffIcon className="size-4" aria-hidden="true" />
        ) : (
          <EyeIcon className="size-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
};

export default PasswordInput;
