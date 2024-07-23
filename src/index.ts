// #region ::: IMPORT :::
import express, { Request, Response } from "express";
import { createClient } from "@vercel/postgres";
import { config } from "dotenv";
import { Server, Socket } from "socket.io";
import { createServer } from "http";
import cors from "cors";
import path from "path";

// #endregion

// #region ::: CONFIGURATION :::
config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

const client = createClient({ connectionString: process.env.DATABASE_URL });
client.connect();
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
// #endregion



// #region :::SOCKETS:::
io.on("connection", (socket) => {
  socket.on("message-sent", ({content, username, idRoom}) => {
    client.query(
      `INSERT INTO messages (content,username, idRoom) VALUES ($1, $2, $3) RETURNING *`,
      [content, username, idRoom],
      (error, res) => {
        if (!error) io.emit("message-received", res.rows[0]);
      }
    );
  });
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});
// #endregion


app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
  express.json()
);

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req: Request, res: Response) => {
    client.connect();
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/api/rooms/:idRoom/messages", (req: Request, res: Response) => {
    client.connect();
  const { idRoom } = req.params;
  client.query("SELECT * FROM messages WHERE idRoom=$1", [Number(idRoom)], (error, response) => {
    if (error) res.status(500).json({ error });
    else res.status(200).json(response.rows);
  });
});

app.get("/api/rooms", (req: Request, res: Response) => {
    client.connect();
  client.query("SELECT * FROM rooms", (error, response) => {
    if (error) res.status(500).json({ error });
    else res.status(200).json(response.rows);
  });
});

app.post("/api/rooms", (req: Request, res: Response) => {
    client.connect();
  const { name} = req.body;
  client.query(
    `INSERT INTO rooms (rooms) VALUES ($1) RETURNING *`,
    [name],
    (error, response) => {
      if (error) res.status(500).json({ error });
      else res.status(200).json(response.rows[0]);
    }
  );
});

app.post("/api/rooms/:idRoom/messages", (req: Request, res: Response) => {
    client.connect();
  const { content, username } = req.body;
  const { idRoom } = req.params;
  client.query(
    `INSERT INTO messages (content, username, idRoom) VALUES ($1,$2, $3)`,
    [content, username, idRoom],
    (error) => {
      if (error) res.status(500).json({ error });
      else res.status(200).json({ message: "Message created successfully" });
    }
  );
});

server.listen(PORT, () => {
    client.connect();
  console.log(`Server API is running http://localhost:${PORT}`);
});