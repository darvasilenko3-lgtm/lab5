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
