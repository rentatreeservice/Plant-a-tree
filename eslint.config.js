import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: ["dist/**", "node_modules/**", "public/js/**", "dist/assets/**"]
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.express,
        io: "readonly",
        socket: "readonly",
        currentUserId: "writable",
        loadDashboard: "readonly",
        logout: "readonly",
        copyReferralLink: "readonly",
        showToast: "readonly"
      },
    },
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "warn",
      "no-console": "off"
    }
  }
];
