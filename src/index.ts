import express from "express";
import cors from "cors";
import { env } from "./config/env";
import chatRoutes from "./routes/chat.routes";

const app = express();

app.use(cors({
    origin: 'http://localhost:4000', // Your Vite dev server
    credentials: true
}));
app.use(express.json());

app.use("/chat", chatRoutes);

app.get("/health", (_, res) => {
	res.json({ status: "ok" });
});
app.listen(env.PORT, () => {
	console.log(`🚀 Server running on port ${env.PORT}`);
});
