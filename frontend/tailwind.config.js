/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 기본 Tailwind 색상들
        gray: {
          50: "#f9fafb",
          100: "#f3f4f6",
          200: "#e5e7eb",
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280",
          600: "#4b5563",
          700: "#374151",
          800: "#1f2937",
          900: "#111827",
        },
        // 커스텀 색상들
        background: "var(--background)",
        foreground: "var(--foreground)",
        wh: "#ffffff",
        bk: "#1c1c1c",
        bg: "#f7f7f7",
        lg: "#e3e3e3",
        gr: "#8a8a8a",
        dg: "#595959",
        "blue-100": "#5666ff",
        "pink-100": "#ff6fdb",
        "orange-50": "#fff4e8",
        "orange-100": "#fc6524",
        brand: "#004cff",
        "brand-sub1": "#5c8dff",
        "brand-sub2": "#80a6ff",
        "brand-light": "#004cff99",
        "brand-op": "#004cff",
        error: "#ff4f6f",
        green: "#00b506",
        yellow: "#ffc800",
        red: "#f31260",
      },
    },
  },
  plugins: [],
};
