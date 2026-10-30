// Runs before first paint so the page never flashes the wrong theme. A file, not inline, to satisfy the CSP.
(function () {
  var saved = null;
  try {
    saved = localStorage.getItem("knot:theme");
  } catch (e) {}
  var dark = saved === "dark" || (saved !== "light" && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
})();
