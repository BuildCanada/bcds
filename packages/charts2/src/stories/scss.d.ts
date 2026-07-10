// Allow stories to side-effect-import the chrome stylesheet under tsc;
// Vite (Storybook) compiles the SCSS at build time.
declare module "*.scss"
