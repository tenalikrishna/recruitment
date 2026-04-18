import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import connectPgSimple from "connect-pg-simple";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { storage } from "./storage";
import { registerRoutes } from "./routes";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const httpServer = createServer(app);

// Trust Render's reverse proxy so secure cookies work over HTTPS
app.set("trust proxy", 1);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Sessions
const PgSession = connectPgSimple(session);
app.use(session({
  store: process.env.DATABASE_URL
    ? new PgSession({ conString: process.env.DATABASE_URL, tableName: "session", createTableIfMissing: true })
    : undefined,
  secret: process.env.SESSION_SECRET || "humanity-recruitment-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}));

// Passport
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    // Support login by username OR email
    const user = await storage.getAdminUserByUsername(username)
      ?? await storage.getAdminUserByEmail(username);
    if (!user) return done(null, false, { message: "Invalid credentials" });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return done(null, false, { message: "Invalid credentials" });
    return done(null, user);
  } catch (err) { return done(err); }
}));
passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser(async (id: string, done) => {
  try { done(null, (await storage.getAdminUser(id)) || false); }
  catch (err) { done(err); }
});

app.use(passport.initialize());
app.use(passport.session());

// API logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    if (req.path.startsWith("/api"))
      console.log(`${req.method} ${req.path} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

registerRoutes(app);

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  res.status(err.status || 500).json({ message: err.message || "Internal Server Error" });
});

const port = parseInt(process.env.PORT || "3001");

(async () => {
  if (process.env.NODE_ENV === "production") {
    const { serveStatic } = await import("./static");
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  httpServer.listen(port, () => console.log(`HUManity Recruitment running on http://localhost:${port}`));
})();
