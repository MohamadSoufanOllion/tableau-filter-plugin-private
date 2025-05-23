// eslint.config.js
const js = require("@eslint/js");
const security = require("eslint-plugin-security");
const noUnsanitized = require("eslint-plugin-no-unsanitized");

module.exports = [
  js.configs.recommended,
  {
    ignores: ["node_modules/**/*"],
    plugins: {
      security,
      "no-unsanitized": noUnsanitized,
    },
    rules: {
      ...security.configs.recommended.rules,
      ...noUnsanitized.configs.recommended.rules,
      "security/detect-object-injection": "off", // Disable specific rules if necessary
    },
  },
];
