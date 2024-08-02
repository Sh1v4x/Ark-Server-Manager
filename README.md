# ARK Server Manager

## Description
#### ARK Server Manager is an application for easily managing your ARK Ascended servers.
#### It includes a Node.js backend with Express and a Flutter frontend for a user-friendly interface.

## Features
#### - Display of ARK server status
#### - Starting and stopping servers
#### - Server updates
#### - Intuitive user interface

## Prerequisites
#### - Node.js (v14 or higher)
#### - npm (v6 or higher)
#### - Flutter (latest stable version)
#### - SteamCMD installed for server updates

## Installation

## Backend
#### 1. Clone this repository:
   ```
   git clone https://github.com/Sh1v4x/ark-server-manager.git
   cd ark-server-manager/backend
   ```
#### 2. Install dependencies:
   ```
   npm install
   ```
#### 3. Create a `.env` file in the root of the backend folder and configure it according to your needs.
#### 4. Start the server:
   ```
   npm start
   ```

## Frontend
#### 1. Navigate to the frontend folder:
   ```
   cd ../frontend
   ```
#### 2. Ensure Flutter is correctly installed and configured.
#### 3. Install dependencies:
   ```
   flutter pub get
   ```
#### 4. Launch the application:
   ```
   flutter run
   ```

## Configuration

## .env File (Backend)
#### Create a `.env` file in the backend folder with the following configurations:
```
PORT="yourport"
HOST="yourip"
ORIGIN="alloworigin"
```

## server.json File
#### Create a `server.json` file at the root of the backend to configure your ARK servers:
```json
{
  "servers": [
    {
      "name": "TheIsland", // TheIsland, ScorchedEarth, TheCenter
      "serverPath": "../server/server/ShooterGame/Binaries/Win64/ArkAscendedServer.exe",
      "imgPath": "http://your_ip:your_port/assets/theisland.png",
      "serverArgs": "your_server_args",
      "rconConfig": {
        "host": "your_local_ip",
        "port": "your_rcon_port",
        "password": "your_ark_server_password",
        "timeout": 9000
      }
    }
  ]
}
```

## Usage
#### 1. Launch the backend by running `npm run build` & `npm run start` in the backend folder.
#### 2. Launch the Flutter application on your device or emulator.
#### 3. The interface will display the list of your ARK servers with their status.
#### 4. Use the buttons to start, stop, or update the servers.

## Contribution
#### Contributions are welcome! Feel free to open an issue or submit a pull request.

## License
#### MIT License

Copyright (c) [2024] [Bomme -- Lasnier Maxime]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
