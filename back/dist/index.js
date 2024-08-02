"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const child_process_1 = require("child_process");
const rcon_client_1 = require("rcon-client");
const fs_1 = __importDefault(require("fs"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, "../.env") });
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
const config = JSON.parse(fs_1.default.readFileSync("server.json", "utf8"));
const serverStates = {};
app.use("/assets", express_1.default.static(path_1.default.join(__dirname, "..", "public", "assets")));
app.use(express_1.default.static(path_1.default.join(__dirname, "..")));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)({
    origin: process.env.ORIGIN,
    credentials: true,
}));
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.static(path_1.default.join(__dirname, "public")));
function startServer(serverConfig) {
    return new Promise((resolve, reject) => {
        (0, child_process_1.exec)(`"${serverConfig.serverPath}" ${serverConfig.serverArgs}`, (error, stdout, stderr) => {
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
        });
    });
}
function rconConnect(rconConfig, serverName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const rcon = new rcon_client_1.Rcon(rconConfig);
            yield rcon.connect();
            serverStates[serverName].status = "running";
            return true;
        }
        catch (error) {
            console.error(`Échec de la connexion RCON pour ${serverName}:`, error.message);
            return false;
        }
    });
}
function updateServer() {
    return new Promise((resolve, reject) => {
        const command = "start ../server/SteamCMD/steamcmd.exe +force_install_dir ../server/ +login anonymous +app_update 2430930 validate +quit";
        (0, child_process_1.exec)(command, (error, stdout, stderr) => {
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
app.post("/update", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        config.servers.forEach((server) => {
            serverStates[server.name] = { status: "updating" };
        });
        yield updateServer(); // Await the updateServer call
        res.json({
            message: `Mise à jour des serveurs terminée`,
        });
    }
    catch (error) {
        res.status(500).json({
            error: `Erreur lors de la mise à jour du serveur : ${error.message}`,
        });
    }
}));
app.post("/start/:serverName", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const serverName = req.params.serverName;
    const serverConfig = config.servers.find((s) => s.name === serverName);
    if (!serverConfig) {
        return res.status(404).json({ error: "Serveur non trouvé" });
    }
    try {
        yield startServer(serverConfig);
        serverStates[serverName] = { status: "starting" };
        res.json({
            message: `Serveur ${serverName} en cours de démarrage...`,
        });
    }
    catch (error) {
        serverStates[serverName] = { status: "stopped" };
        res.status(500).json({
            error: `Erreur lors du démarrage du serveur ${serverName}: ${error.message}`,
        });
    }
}));
app.post("/stop/:serverName", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const serverName = req.params.serverName;
    const serverConfig = config.servers.find((s) => s.name === serverName);
    if (!serverConfig) {
        return res.status(404).json({ error: "Serveur non trouvé" });
    }
    try {
        const rcon = new rcon_client_1.Rcon(serverConfig.rconConfig);
        yield rcon.connect();
        yield rcon.send('ServerChatTo "Le serveur va s\'arrêter dans 10 secondes"');
        yield new Promise((resolve) => setTimeout(resolve, 10000));
        yield rcon.send("DoExit");
        yield rcon.end();
        serverStates[serverName] = { status: "stopped" };
        res.json({ message: `Serveur ${serverName} arrêté avec succès` });
    }
    catch (error) {
        res
            .status(500)
            .json({ error: `Erreur lors de l'arrêt du serveur ${serverName}` });
    }
}));
function refreshServerStatus() {
    return __awaiter(this, void 0, void 0, function* () {
        const serversStatus = yield Promise.all(config.servers.map((server) => __awaiter(this, void 0, void 0, function* () {
            if (!serverStates[server.name]) {
                serverStates[server.name] = { status: "stopped" };
            }
            if (serverStates[server.name].status === "starting" ||
                serverStates[server.name].status === "stopped") {
                const rconPromise = rconConnect(server.rconConfig, server.name);
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => {
                    reject(new Error("Timeout"));
                }, 10000));
                try {
                    yield Promise.race([rconPromise, timeoutPromise]);
                }
                catch (error) {
                    console.error(`Timeout lors du démarrage du serveur ${server.name}`);
                }
            }
            return {
                name: server.name,
                status: serverStates[server.name].status,
                img: `${server.imgPath}`,
            };
        })));
        return serversStatus;
    });
}
app.get("/servers", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const serversStatus = yield refreshServerStatus();
        console.log(serversStatus);
        res.json(serversStatus);
    }
    catch (error) {
        console.error("Erreur lors de la récupération du statut des serveurs:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
}));
app.listen(Number(port), process.env.HOST || "localhost", () => {
    console.log(`Server is running`);
    console.log(process.env.HOST);
    console.log(port);
});
