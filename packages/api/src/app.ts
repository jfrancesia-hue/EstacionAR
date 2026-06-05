// Ensamblado de la API Express. Arquitectura por capas (routers -> store) migrable a NestJS:
// cada router equivale a un controller; el store, a repositorios/Prisma sobre Supabase.
import express, { type Express, type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import { db } from "./store.js";
import { env } from "./env.js";
import { HttpError, h } from "./http.js";
import { catalogosRouter } from "./routes/catalogos.js";
import { permisionariosRouter } from "./routes/permisionarios.js";
import { transaccionesRouter } from "./routes/transacciones.js";
import { gestionRouter } from "./routes/gestion.js";
import { fiscalRouter } from "./routes/fiscal.js";

export function createApp(): Express {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  // Health check (FASE 0 / deploy)
  app.get("/api/health", (_req, res) =>
    res.json({ ok: true, service: "estacionar-api", demo: env.isDemo, ts: new Date().toISOString() }),
  );

  // Login demo para gating por rol (sin auth real — la demo no expone datos sensibles).
  app.post(
    "/api/auth/demo-login",
    h((req: Request, res: Response) => {
      const role = String(req.body?.role ?? "admin_municipal");
      const user =
        db.users.find((u) => u.role === role) ?? {
          id: "usr-demo",
          email: `${role}@demo`,
          fullName: "Usuario DEMO",
          role,
          createdAt: new Date().toISOString(),
        };
      res.json({ user, token: `DEMO-TOKEN-${role}`, demo: true });
    }),
  );

  app.use("/api", catalogosRouter);
  app.use("/api/permisionarios", permisionariosRouter);
  app.use("/api", transaccionesRouter);
  app.use("/api", gestionRouter);
  app.use("/api", fiscalRouter);

  // 404
  app.use((_req: Request, res: Response) => res.status(404).json({ error: "Ruta no encontrada." }));

  // Manejo de errores
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ error: err.message, details: err.details });
    }
    const message = err instanceof Error ? err.message : "Error interno";
    // eslint-disable-next-line no-console
    console.error("[API error]", err);
    res.status(500).json({ error: message });
  });

  return app;
}
