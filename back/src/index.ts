import express, { Request, Response } from "express";
import { exec } from "child_process";
import { Rcon, RconOptions } from "rcon-client";
import fs from "fs";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const port = process.env.PORT || 3000;

interface ServerConfig {
  name: string;
  serverPath: string;
  serverArgs: string;
  rconConfig: RconOptions;
  imgPath?: string;
}

interface ServerState {
  status: string;
}

const config = JSON.parse(fs.readFileSync("server.json", "utf8")) as {
  servers: ServerConfig[];
};
const serverStates: Record<string, ServerState> = {};

app.use(
  "/assets",
  express.static(path.join(__dirname, "..", "public", "assets"))
);

app.use(express.static(path.join(__dirname, "..")));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.ORIGIN,
    credentials: true,
  })
);
app.use(morgan("dev"));

app.use(express.static(path.join(__dirname, "public")));

function startServer(serverConfig: ServerConfig): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(
      `"${serverConfig.serverPath}" ${serverConfig.serverArgs}`,
      (error, stdout, stderr) => {
        if (stdout) {
          console.log(`stdout: ${stdout}`);
          resolve();
          return;
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
          reject(stderr);
          return;
        }
        if (error) {
          console.error(`Erreur d'exécution : ${error}`);
          reject(error);
          return;
        }
        console.log(`Serveur ${serverConfig.name} en cours de démarrage`);
        resolve();
      }
    );
  });
}

async function rconConnect(
  rconConfig: RconOptions,
  serverName: string
): Promise<boolean> {
  try {
    const rcon = new Rcon(rconConfig);
    await rcon.connect();
    serverStates[serverName].status = "running";
    return true;
  } catch (error) {
    console.error(
      `Échec de la connexion RCON pour ${serverName}:`,
      (error as Error).message
    );
    return false;
  }
}

function updateServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    const command =
      'start ../server/SteamCMD/steamcmd.exe +force_install_dir ../server/ +login anonymous +app_update 2430930 validate +quit';
    exec(command, (error, stdout, stderr) => {
      if (stdout) {
        console.log(`stdout: ${stdout}`);
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
      }
      if (error) {
        console.error(`Erreur d'exécution : ${error}`);
        reject(error);
        return;
      }
      config.servers.forEach((server) => {
        serverStates[server.name] = { status: "stopped" };
      });
      console.log("Mise à jour du serveur terminée");
      resolve();
    });
  });
}

app.post("/update", async (req: Request, res: Response) => {
  try {
    config.servers.forEach((server) => {
      serverStates[server.name] = { status: "updating" };
    });
    await updateServer(); // Await the updateServer call
    res.json({
      message: `Mise à jour des serveurs terminée`,
    });
  } catch (error) {
    res.status(500).json({
      error: `Erreur lors de la mise à jour du serveur : ${
        (error as Error).message
      }`,
    });
  }
});

app.post("/start/:serverName", async (req: Request, res: Response) => {
  const serverName = req.params.serverName;
  const serverConfig = config.servers.find((s) => s.name === serverName);

  if (!serverConfig) {
    return res.status(404).json({ error: "Serveur non trouvé" });
  }

  try {
    await startServer(serverConfig);
    serverStates[serverName] = { status: "starting" };
    res.json({
      message: `Serveur ${serverName} en cours de démarrage...`,
    });
  } catch (error) {
    serverStates[serverName] = { status: "stopped" };
    res.status(500).json({
      error: `Erreur lors du démarrage du serveur ${serverName}: ${
        (error as Error).message
      }`,
    });
  }
});

app.post("/stop/:serverName", async (req: Request, res: Response) => {
  const serverName = req.params.serverName;
  const serverConfig = config.servers.find((s) => s.name === serverName);

  if (!serverConfig) {
    return res.status(404).json({ error: "Serveur non trouvé" });
  }

  try {
    const rcon = new Rcon(serverConfig.rconConfig);
    await rcon.connect();
    await rcon.send('ServerChatTo "Le serveur va s\'arrêter dans 10 secondes"');
    await new Promise((resolve) => setTimeout(resolve, 10000));
    await rcon.send("DoExit");
    await rcon.end();

    serverStates[serverName] = { status: "stopped" };
    res.json({ message: `Serveur ${serverName} arrêté avec succès` });
  } catch (error) {
    res
      .status(500)
      .json({ error: `Erreur lors de l'arrêt du serveur ${serverName}` });
  }
});

async function refreshServerStatus() {
  const serversStatus = await Promise.all(
    config.servers.map(async (server) => {
      if (!serverStates[server.name]) {
        serverStates[server.name] = { status: "stopped" };
      }
      if (
        serverStates[server.name].status === "starting" ||
        serverStates[server.name].status === "stopped"
      ) {
        const rconPromise = rconConnect(server.rconConfig, server.name);
        const timeoutPromise = new Promise<void>((_, reject) =>
          setTimeout(() => {
            reject(new Error("Timeout"));
          }, 10000)
        );

        try {
          await Promise.race([rconPromise, timeoutPromise]);
        } catch (error) {
          console.error(`Timeout lors du démarrage du serveur ${server.name}`);
        }
      }

      return {
        name: server.name,
        status: serverStates[server.name].status,
        img: `${server.imgPath}`,
      };
    })
  );

  return serversStatus;
}

app.get("/servers", async (req: Request, res: Response) => {
  try {
    const serversStatus = await refreshServerStatus();
    console.log(serversStatus);
    res.json(serversStatus);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération du statut des serveurs:",
      error
    );
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.listen(Number(port), process.env.HOST || "localhost", () => {
  console.log(`Server is running`);
  console.log(process.env.HOST);
  console.log(port);
});
