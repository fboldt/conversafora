const http = require("http");
const fs = require("fs");
const url = require("url");

const clientHTML = fs.readFileSync("chatClient.html");

let clients = []; 

let server = new http.Server();
const porta = process.env.PORT || 3000;
server.listen(porta);

server.on("request", (req, res) => {
    let pathname = url.parse(req.url).pathname;

    if (pathname ==="/") {
        res.writeHead(200, {"Content-Type": "text/html"}).end(clientHTML);
    }
    else if (pathname !== "/chat" ||
            (req.method !== "GET" && req.method !== "POST")) {
                res.writeHead(404).end();
            }
    else if (req.method === "GET") {
        acceptNewClient(req, res);
    }
    else {
        broadcastNewMessage(req, res);
    }
});

function acceptNewClient(req, res) {
    clients.push(res);

    req.connection.on("end", () => {
        clients.splice(clients.indexOf(res), 1);
        res.end();
    });

    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Connection": "keep-alive",
        "Cache-Control": "no-cache"
    });
    res.write("event: chat\ndata:Connected\n\n");
}

async function broadcastNewMessage(req, res) {
    req.setEncoding("utf8");
    let body = "";
    for await (let chunck of req) {
        body += chunck;
    }
    
    res.writeHead(200).end();

    let message = "data: " + body.replace("\n", "\ndata: ");

    let event = `event: chat\n${message}\n\n`;
    clients.forEach(client => client.write(event));
}