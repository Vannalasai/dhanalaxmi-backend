// backend/env.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: "development" | "production";
    PORT?: string;
    MONGO_URI: string;
    JWT_SECRET: string;
    ADMIN_SECRET: string;
    EMAIL_USER: string;
    EMAIL_PASS: string;
  }
}
