import express from "express";
import cors from "cors";
import { env } from "./config/env";
import chatRoutes from "./routes/chat.routes";
import emailRoutes from "./routes/email.routes";

const app = express();

// Add request logging middleware
app.use((req, res, next) => {
	console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
	next();
});

app.use(cors({
    origin: 'http://localhost:5173', // Your Vite dev server
    credentials: true
}));
app.use(express.json());

app.use("/chat", chatRoutes);
app.use(emailRoutes); // Mount at root so /send-email works directly

app.get("/health", (_, res) => {
	res.json({ status: "ok" });
});
app.listen(env.PORT, () => {
	console.log(`🚀 Server running on port ${env.PORT}`);
});
