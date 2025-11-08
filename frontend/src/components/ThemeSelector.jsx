import { PaletteIcon } from "lucide-react";
import { useThemeStore } from "../store/useThemeStore";
import { THEMES } from "../constants";

const ThemeSelector = () => {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="space-y-1">
      {THEMES.map((themeOption) => (
        <button
          key={themeOption.name}
          className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 transition-colors ${
            theme === themeOption.name
              ? "bg-primary/10 text-primary"
              : "hover:bg-base-content/5"
          }`}
          onClick={() => setTheme(themeOption.name)}
        >
          <PaletteIcon className="size-4" />
          <span className="text-sm font-medium">{themeOption.label}</span>
          <div className="ml-auto flex gap-1">
            {themeOption.colors.map((color, i) => (
              <span
                key={i}
                className="size-2 rounded-full"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </button>
      ))}
    </div>
  );
};
export default ThemeSelector;
