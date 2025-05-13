// eslint.config.js
const js = require("@eslint/js");
const security = require("eslint-plugin-security");
const noUnsanitized = require("eslint-plugin-no-unsanitized");

export default [
  js.configs.recommended,
  {
    plugins: {
      security,
      noUnsanitized,
    },
    rules: {
      ...security.configs.recommended.rules,
      ...noUnsanitized.configs.recommended.rules,
      "security/detect-object-injection": "off", // Example: Disable specific rules if necessary
    },
  },
];
