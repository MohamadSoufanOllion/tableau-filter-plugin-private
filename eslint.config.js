// eslint.config.js
import js from "@eslint/js";
import security from "eslint-plugin-security";
import noUnsanitized from "eslint-plugin-no-unsanitized";

export default [
  js.configs.recommended,
  {
    plugins: {
      security,
      noUnsanitized
    },
    rules: {
      ...security.configs.recommended.rules,
      ...noUnsanitized.configs.recommended.rules,
      "security/detect-object-injection": "off" // Example: Disable specific rules if necessary
    }
  }
];
