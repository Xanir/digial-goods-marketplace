import fs from 'fs'
import path from 'path'
import http from 'http'
import https from 'https'
import express from 'express'

const httpApp = express();
const httpsApp = express();

 const hostname = process.argv.slice(2)[0]
 const isLocalDev = hostname.startsWith('localhost')

let app = isLocalDev ? httpApp : httpsApp
if (!isLocalDev) {
    httpApp.get('*', function(req, res) {
        res.redirect('https://' + req.headers.host + req.url);
    })
}

app.use(express.static('build'));
const indexFile = path.join(path.resolve(), 'build', 'index.html')
app.get('*', function(req, res){
    res.sendFile(indexFile);
});

if (!isLocalDev) {
    const sslFolder = path.join(path.resolve(), '.sslcert')
    const sslCertPath = path.join(sslFolder, 'fullchain.pem')
    const sslKeyPath = path.join(sslFolder, 'privkey.pem')
    const options = {
        cert: fs.readFileSync(sslCertPath),
        key: fs.readFileSync(sslKeyPath),
    };
    https.createServer(options, app).listen(443);
    console.log('HTTP to HTTPS redirect running')

    http.createServer(httpApp).listen(80);
    console.log('Proxy / file host running')
} else {
    http.createServer(app).listen(80);
    console.log('Proxy / file host running')
}
