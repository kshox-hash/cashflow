import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import DB from "./db/db-configuration";

const PORT = Number(process.env.PORT) || 3001;

async function bootstrap() {
  await DB.testConnection();

  const server = app.listen(PORT, () => {
    console.log(`[server] Corriendo en http://localhost:${PORT} (${process.env.NODE_ENV ?? "development"})`);
  });

  process.on("SIGTERM", () => {
    console.log("[server] SIGTERM recibido, cerrando servidor...");
    server.close(() => process.exit(0));
  });
}

process.on("unhandledRejection", (reason) => {
  console.error("[server] Unhandled rejection:", reason);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("[server] Uncaught exception:", err);
  process.exit(1);
});

bootstrap().catch((err) => {
  console.error("[server] Error al iniciar:", err);
  process.exit(1);
});
