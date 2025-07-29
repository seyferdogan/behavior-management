const fs = require('fs');
const path = require('path');

const sslConfig = {
    key: fs.readFileSync(path.join(__dirname, '../../certificates/localhost.key')),
    cert: fs.readFileSync(path.join(__dirname, '../../certificates/localhost.crt'))
};

module.exports = sslConfig;
