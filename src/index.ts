import express from "express";
import cors from "cors";
import { env } from "./config/env";
import chatRoutes from "./routes/chat.routes";
import emailRoutes from "./routes/email.routes";
import dealerRoutes from "./routes/dealer.routes";
import adminRoutes from "./routes/admin.routes";

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL 
        ? [
            process.env.FRONTEND_URL, 
            `https://www.${process.env.FRONTEND_URL.replace('https://', '')}`,
            'http://localhost:5173',  // car-genie frontend
            'http://localhost:5174',  // carrie-marketing frontend
        ]
        : ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true
}));
app.use(express.json());

// Add request logging middleware (after body parser)
app.use((req, res, next) => {
	console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
	console.log("Body:", req.body);
	next();
});

app.use("/chat", chatRoutes);
app.use(emailRoutes); // Mount at root so /send-email works directly
app.use("/dealers", dealerRoutes);
app.use("/admin", adminRoutes);

app.get("/health", (_, res) => {
	res.json({ status: "ok" });
});
app.listen(env.PORT, () => {
	console.log(`🚀 Server running on port ${env.PORT}`);
});
