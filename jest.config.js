export default {
  testEnvironment: "node",

  testMatch: ["**/*.test.js"],

  collectCoverageFrom: [
    "src/controllers/**/*.js"
  ],

  coverageDirectory: "coverage",

  coverageReporters: [
    "text",
    "html"
  ],

  verbose: true
}