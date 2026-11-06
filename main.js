const http = require('http');
const fs = require('fs/promises');
const path = require('path');
const { program } = require('commander');
const superagent = require('superagent');

program
    .requiredOption('-h, --host <address>', 'Адреса сервера')
    .requiredOption('-p, --port <number>', 'Порт сервера')
    .requiredOption('-c, --cache <path>', 'Шлях до теки кешу');

program.parse(process.argv);
const options = program.opts();

const startServer = async () => {
    try {
        //асинхронне створення теки кешу, якщо її не існує
        await fs.mkdir(options.cache, { recursive: true });

        const server = http.createServer(async (req, res) => { 
            try { 
                    const codeMatch = req.url.match(/^\/(\d+)$/);

                    if (!codeMatch) {
                        res.writeHead(404, { 'Content-Type': 'text/plain' });
                        return res.end('Not Found');
                    }

                    const httpCode = codeMatch[1];
                    const cacheFilePath = path.join(options.cache, `${httpCode}.jpg`);

                    if (req.method === 'GET') {
                        try {
                            const imageBuffer = await fs.readFile(cacheFilePath);
                            res.writeHead(200, {
                                'Content-Type': 'image/jpeg',
                                'X-Image-Source': 'Cache' 
                            });
                            return res.end(imageBuffer);
                        } catch (err) {
                            try {
                                const response = await superagent.get(`https://http.cat/${httpCode}`);
                                const fetchedImage = response.body;

                                await fs.writeFile(cacheFilePath, fetchedImage);

                                res.writeHead(200, {
                                    'Content-Type': 'image/jpeg',
                                    'X-Image-Source': 'http.cat API'
                                });
                                return res.end(fetchedImage);
                            } catch (fetchErr) {
                                res.writeHead(404, { 'Content-Type': 'text/plain' });
                                return res.end('Image not found on http.cat');
                            }
                        }
                }
                    else if (req.method === 'PUT') {
                        const chunks = [];
                        for await (const chunk of req) {
                            chunks.push(chunk);
                        }
                        const bodyBuffer = Buffer.concat(chunks);

                        await fs.writeFile(cacheFilePath, bodyBuffer);
                        res.writeHead(201, { 'Content-Type': 'text/plain' });
                        return res.end('Created');
                }
                    else if (req.method === 'DELETE') {
                        try {
                            await fs.unlink(cacheFilePath);
                            res.writeHead(200, { 'Content-Type': 'text/plain' });
                            return res.end('Deleted');
                        } catch (err) {
                            res.writeHead(404, { 'Content-Type': 'text/plain' });
                            return res.end('Not Found in cache');
                        }
                    }
        });

        server.listen(options.port, options.host, () => {
            console.log(`Сервер запущено на http://${options.host}:${options.port}`);
        });
    } catch (err) {
        console.error('Помилка запуску сервера:', err);
        process.exit(1);
    }
};

startServer();
