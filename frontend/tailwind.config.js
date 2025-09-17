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
        brand: "#3E93FA",
        "brand-sub1": "#6BAEFF",
        "brand-sub2": "rgba(128, 185, 255, 0.8)",
        "brand-light": "rgba(62, 147, 250, 0.6)",
        "brand-op": "rgba(62, 147, 250, 0.04)",
        error: "#ff4f6f",
        green: "#00b506",
        yellow: "#ffc800",
        red: "#f31260",
      },
    },
  },
  plugins: [],
};
