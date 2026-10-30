import { useTheme } from "../../lib/theme";
import { cx } from "../../lib/format";
import { Icon } from "./Icon";

/** One tap between light and dark. Settings also offers "match my device". */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setChoice } = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button type="button" onClick={() => setChoice(next)} aria-label={`Switch to ${next} theme`} className={cx("rounded-full p-2.5", className)}>
      <Icon name={theme === "dark" ? "sun" : "moon"} />
    </button>
  );
}
