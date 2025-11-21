import { useEffect, useRef, useState } from "react";
import { SmileIcon } from "lucide-react";

const EMOJI_PALETTE = [
  "😀",
  "😂",
  "😊",
  "😍",
  "👍",
  "🙏",
  "🔥",
  "🎉",
  "😎",
  "🤔",
  "🥰",
  "🙌",
  "😇",
  "😴",
  "🤯",
  "😅",
  "🤝",
  "🥳",
];

const getTheme = () => {
  if (typeof document === "undefined") return "light";
  const attr =
    document.documentElement?.getAttribute("data-theme") ||
    document.body?.getAttribute("data-theme") ||
    "";
  return attr?.toLowerCase().includes("dark") ? "dark" : "light";
};

const EmojiPickerButton = ({ onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState(() => getTheme());
  const buttonRef = useRef(null);
  const pickerRef = useRef(null);

  useEffect(() => {
    if (typeof document === "undefined" || !isOpen) return undefined;
    const handleClick = (event) => {
      if (
        pickerRef.current?.contains(event.target) ||
        buttonRef.current?.contains(event.target)
      ) {
        return;
      }
      setIsOpen(false);
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (typeof MutationObserver === "undefined" || typeof document === "undefined") {
      return undefined;
    }
    const observer = new MutationObserver(() => setTheme(getTheme()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class"],
    });
    return () => observer.disconnect();
  }, []);

  const handleEmojiSelect = (emoji) => {
    if (typeof onSelect === "function") {
      onSelect(emoji);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative ml-2">
      <button
        type="button"
        ref={buttonRef}
        className="flex items-center justify-center rounded-full border border-base-300 bg-base-200/70 p-2 hover:bg-base-200"
        aria-label="Add emoji"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <SmileIcon className="size-4 text-base-content/70" />
      </button>
      {isOpen && (
        <div
          ref={pickerRef}
          className="absolute bottom-12 right-0 z-50 w-56 rounded-xl border border-base-300 bg-base-100 p-2 shadow-lg"
          data-theme={theme}
        >
          <div className="grid grid-cols-6 gap-1 text-lg">
            {EMOJI_PALETTE.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="rounded p-1 hover:bg-base-200"
                onClick={() => handleEmojiSelect(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmojiPickerButton;
