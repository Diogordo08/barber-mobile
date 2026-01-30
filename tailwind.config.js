/** @type {import('tailwindcss').Config} */
module.exports = {
  // 👇 ESSA LINHA É OBRIGATÓRIA PARA NÃO DAR ERRO NA WEB
  darkMode: "class", 
  
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
}