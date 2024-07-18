// #region import 
import { createClient } from "@vercel/postgres";
import express, {Request, Response} from "express";
import {config} from "dotenv";
import { Server } from "socket.io";
import { createServer } from "http";
import cors from "cors";
// #endregion 
config();
const app =express();
const port = 3000;
const server= createServer(app);
const io = new Server(server,{cors:{
    origin:"*",
    methods:["GET","POST"]
  }
  });
const client = createClient({
    connectionString: process.env.DATABASE_URL,
})
client.connect();
app.use(express.json());
io.on("connection", (socket) => {
    console.log("A user connected")
    socket.on("message-sent", (message) => {
        client.query('INSERT INTO messages (content) VALUES ($1)', [message],(error) => {
            if (!error) io.emit("message-received", message)
    })
    socket.on("disconnect", () => {
        console.log("User disconnected")
    })
});
})
app.get("/api/messages",(req: Request, res: Response) => {
      const result = client.query("SELECT * FROM messages", (error, response)  => {
        if (error) res.status(500).json({ error });
        else res.status(200).json(response.rows);
      });
  });
app.post("/api/messages", (req:Request, res:Response) => {
    const {content} = req.body;
    client.query('INSERT INTO messages (content) VALUES ($1)', [content],(error, response) => {
        if (error) res.status(500).json({ error });
        else res.status(200).json({message : "Message created successfully!"});
    });

})
server.listen(3000, () => {
    console.log(`server is running on http://localhost:${3000}/api/messages`);
})
app.listen(8080, () => {
    console.log(`server is running on http://localhost:${8080}/api/messages`);
})