import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import fs from 'fs/promises';
import { createServer } from "http";
import path from "path";
import { Server } from "socket.io";
import Config from "./config";

class CommunicationServer {
  app;
  httpServer;
  io;
  private jsonParser;

  constructor(public config: Config, private extensionsPath: string, private enableRemoteEval: boolean) {
    this.app = express();
    this.app.use(cors({
      origin: '*',
    }));
    this.httpServer = createServer(this.app);
    this.io = new Server(this.httpServer, {
      cors: {
        origin: '*',
      }
    });
    this.jsonParser = bodyParser.json();

    this.initializeEvents();
  }

  start() {
    this.httpServer.listen(this.config.settings.port);
  }

  private initializeEvents() {
    this.app.get('/extensions/:file', (req, res) => {
      if (req.params.file.includes('..')) {
        res.status(404).send('No ".." allowed in file name.');
        return;
      }

      res.type('.js');
      res.sendFile(path.join(this.extensionsPath, req.params.file));
    });

    this.io.on("connection", (socket) => {
      let hasAccess = false;

      socket.on("access", async (key?: string, response?: (success: boolean) => {}) => {
        if (!key || !response) {
          return;
        }

        hasAccess = key === this.config.settings.accessKey;
        response(hasAccess);

        if (hasAccess) {
          socket.emit("loadExtension",
            await fs.readdir(this.extensionsPath, { withFileTypes: true })
              .then(files => files.filter(file => file.isFile() && file.name.endsWith(".js"))
                .map(file => file.name))
          );
        }
      });
    });
  }
}

export default CommunicationServer;

