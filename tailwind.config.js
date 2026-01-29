/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")], // <--- LINHA NOVA OBRIGATÓRIA
  theme: {
    extend: {},
  },
  plugins: [],
}