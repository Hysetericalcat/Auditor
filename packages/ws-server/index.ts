import { WebSocketServer, WebSocket } from "ws";
import { Check, Main, Resume } from "../Agents/rca/main/main";


const wss = new WebSocketServer({ port: 8080 });

console.log("WebSocket server starting on port 8080...");

wss.on("connection", function connection(ws: WebSocket) {
    console.log("New connection established");

    ws.on("message", async function message(data) {
        try {
            const msg = JSON.parse(data.toString());

            if (msg.type === "main") {
                const query = msg.query || msg.userMessage || "";
                const isPharm = await Check(query);
                if (!isPharm) {
                    ws.send(JSON.stringify({
                        type: "status",
                        data: "I'm a pharmaceutical batch analysis agent specialized in manufacturing RCA. I can only help with batch comparison, deviation analysis, and process quality topics. Please rephrase your query in the context of pharmaceutical manufacturing."
                    }));
                    return;
                }

                await Main(query, undefined, ws);
            } else if (msg.type === "resume") {
                if (msg.threadId === undefined || msg.approved === undefined) {
                    ws.send(JSON.stringify({ type: "error", data: "Missing threadId or approval status for resume" }));
                    return;
                }
                await Resume(msg.threadId, msg.approved, undefined, ws);
            } else {
                ws.send(JSON.stringify({ type: "error", data: "Unknown message type" }));
            }
        } catch (error: any) {
            console.error("Error processing message:", error);
            ws.send(JSON.stringify({ type: "error", data: `Server Error: ${error.message}` }));
        }
    });

    ws.on("error", (err) => console.error("WebSocket error:", err));
    ws.on("close", () => console.log("Client disconnected"));
});