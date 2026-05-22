import express from "express";
import { ENV } from "./config/env";
import { connectDB } from "./core/database";
import { AuthRequest, Verify } from "./core/middleware";
import cors from "cors";
import compression from "compression";
import { rateLimit } from "express-rate-limit";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { initScheduler } from "./core/services/scheduler";
import dns from 'node:dns';
dns.setServers(["1.1.1.1", "8.8.8.8"]);


//Swagger UI
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./docs/swagger";

// Routers
import authRouter from "./modules/auth/authRoute";
import userRouter from "./modules/user/userRoute";
import studioRouter from "./modules/studio/studioRoute";
import leadRouter from "./modules/lead/leadRoute";
import projectRouter from "./modules/project/projectRoute";
import InventoryRouter from "./modules/inventory/inventoryRoute";
import ExpenseRouter from "./modules/expenses/expensesRoute";
import quotationRouter from "./modules/quotation/quotationRoute";
import contractRouter from "./modules/contract/contractRoute";
import followUpRouter from "./modules/followUp/followUpRoute";
import galleryRouter from "./modules/gallery/galleryRoute";
import eventRouter from "./modules/event/eventRoute";
import clientRoutes from "./modules/client/clientRoute";
import contactRouter from "./modules/contactUs/contactRoute";
import foundingStudioRouter from "./modules/foundingStudio/foundingStudioRoutes";
import ticketRouter from "./modules/tickets/ticketRoute";
import adminRouter from "./modules/admin/adminRoute";
import downloadRouter from "./modules/download/downloadRoute";
import paymentRouter from "./modules/payment/paymentRoute";
import subscriptionRouter from "./modules/subscription/subscriptionRoute";

import roleRouter from './modules/studio/roleRoute';
import pricingRouter from './modules/pricing/pricingRoute';
import templateRouter from './modules/template/templateRoute';

connectDB();
initScheduler(); // Initialize cron jobs

const app = express();

/* =======================
   ✅ CORS FIRST
======================= */
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://crm-v2-client.netlify.app",
  "https://plexis-v2-client-rch75.ondigitalocean.app",
  "https://test-client-ksj66.ondigitalocean.app",
  "https://plexis-staging-server-kvzzd.ondigitalocean.app",
  "https://plexis-staging-a53pd.ondigitalocean.app",
  "https://plexis.in",
  "https://www.plexis.in",
  "capacitor://localhost",
  "http://localhost",
  "ionic://localhost",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 3600,
  })
);

// Explicitly set credentials header
app.use((req, res, next) => {
  const origin = req.get('origin');
  if (allowedOrigins.includes(origin || '')) {
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  next();
});

// Swagger UI setup
app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

/* =======================
   COMPRESSION
======================= */
app.use(compression());

/* =======================
   RATE LIMITING
======================= */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts, please try again later." },
});

app.use(globalLimiter);

/* =======================
   ✅ BODY SIZE LIMIT (FIX 413)
======================= */
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

/* =======================
   OTHER MIDDLEWARES
======================= */
app.use(cookieParser());
app.use(morgan("dev"));

/* =======================
   ROUTES
======================= */
app.use("/auth", authLimiter, authRouter);
app.use("/user", Verify, userRouter);
app.use("/studio", Verify, studioRouter);
app.use("/lead", leadRouter);
app.use("/project", Verify, projectRouter);
app.use("/inventory", Verify, InventoryRouter);
app.use("/expenses", Verify, ExpenseRouter);
app.use("/quotation", quotationRouter);
app.use("/contract", contractRouter);
app.use("/contact", contactRouter);
app.use("/api/foundingStudio", foundingStudioRouter);
app.use("/followup", Verify, followUpRouter);
app.use("/gallery", galleryRouter);
app.use("/tickets", Verify, ticketRouter);
app.use("/events", Verify, eventRouter);
app.use("/api/clients", Verify, clientRoutes);
app.use("/superadmin", adminRouter);
app.use("/download", downloadRouter)

app.use("/role", roleRouter);
app.use("/payment", paymentRouter);
app.use("/subscription", Verify, subscriptionRouter);
app.use("/pricing", Verify, pricingRouter);
console.log("🛠️ Mounting /api/templates route");
app.use("/api/templates", Verify, templateRouter);


app.get("/", (req, res) => {
  res.send("Welcome to Plexis CRM API");

});

app.get("/test", Verify, (req: AuthRequest, res) => {
  res.json({
    message: "If you see this, the middleware worked!",
    userData: req.user,
  });
});

app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err?.type === "entity.too.large" || err?.status === 413) {
    return res.status(413).json({
      success: false,
      message: "Upload payload is too large. Please reduce file size or upload fewer files.",
    });
  }

  if (err) {
    console.error("Unhandled server error:", err);
  }

  return next(err);
});

app.listen(ENV.PORT, () => {
  console.log(`🚀 Server running on port ${ENV.PORT}`);
}).on('error', (err) => {
  console.error('Server failed to start:', err);
});
