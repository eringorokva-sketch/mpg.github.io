/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        clinicBlue: "#0ea5a4",
        clinicGreen: "#10b981"
      }
    }
  },
  plugins: []
};
