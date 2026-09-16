// `server-only` is resolved by Next.js itself (next/dist/compiled/server-only):
// importing it from a module that ends up in a client bundle is a build error.
// This declaration only lets `tsc --noEmit` accept the bare import.
declare module "server-only";
