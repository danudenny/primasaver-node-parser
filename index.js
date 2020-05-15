var net = require("net");
let mysql = require('mysql');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

var hexToFloat = require('./utils/hexToFloat');
var log = require('./config/winston');
let config = require('./config/database');

var server = net.createServer();
let connection = mysql.createConnection(config);

connection.connect(function(err) {
    if (err) {
        log.error(err)
        console.log(`Database ${config.host} not connected`)
    } else {
        console.log(`Database connected on ${config.host}`)
    }
})

if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`);

    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died. restarting...`, worker.process.pid, signal || code);
        cluster.fork();
        if (worker.exitedAfterDisconnect === true) {
            console.log('Oh, it was just voluntary – no need to worry');
        }
    });

} else {
    server.on("connection", function (socket) {
        var remoteAddress = socket.remoteAddress + ":" + socket.remotePort;
        console.log(remoteAddress);

        socket.on("data", function (raw) {
            var firstRaw = remoteAddress + "," + raw;
            var splittedFisrtRaw = firstRaw.split(',');
            var rawData = splittedFisrtRaw[1];
            var workerId = `Worker ${process.pid}`

            if (rawData.length != 195) {
                console.log('Not Complete Data');
                connection.query("INSERT INTO parse_result (parse, status, cluster, client_ip) VALUES (?, 'Uncompleted Data', ?, ?)", [rawData, workerId, remoteAddress], function (err, result, fields) {
                    if (err) throw err;
                });
            } else if (raw == 0) {
                console.log('Empty Data');
                connection.query("INSERT INTO parse_result (parse, status, cluster, client_ip) VALUES (?, 'Empty / No Data', ?, ?)", [rawData, workerId, remoteAddress], function (err, result, fields) {
                    if (err) throw err;
                });
            } else if (rawData.length == 195) {
                console.log('Receive Single Data');
                connection.query("INSERT INTO parse_result (parse, status, cluster, client_ip) VALUES (?, 'Receive Single Data', ?, ?)", [rawData, workerId, remoteAddress], function (err, result, fields) {
                    if (err) throw err;
                });
            } else {
                var splitRawData = rawData.match(/.{1,195}/g);
                for (let index = 0; index < splitRawData.length; index++) {
                    let dataResultLog = [splitRawData[index]];
                    connection.query("INSERT INTO parse_result (parse, status, cluster, client_ip) VALUES (?, 'Success', ?, ?)", [dataResultLog, workerId, remoteAddress], function (err, result, fields) {
                        if (err) throw err;
                    });

                    // connection.end();
                    let dataResult = splitRawData[index];
                    // Jenis
                    var jenis = dataResult.substring(0, 2);
                    if (jenis == 'ED') {
                        var jenis = 'EDMI';
                    };

                    // In Out
                    var in_out = dataResult.substring(2, 3);
                    if (in_out == 1) {
                        var in_out = 'in';
                    } else {
                        var in_out = 'out';
                    }

                    // Device ID
                    var deviceId = dataResult.substring(2, 11).toUpperCase();

                    // DateTime
                    var dateTime = dataResult.substring(11, 19);

                    // kWh
                    var kwhString = dataResult.substring(19, 27);
                    var splitData = kwhString.match(/.{1,4}/g);
                    var reverse = splitData[1] + splitData[0];
                    var kwh = hexToFloat.HexToFloat(reverse);

                    // wtot
                    var wtotString = dataResult.substring(27, 35);
                    var splitData = wtotString.match(/.{1,4}/g);
                    var reverse = splitData[1] + splitData[0];
                    var wtot = hexToFloat.HexToFloat(reverse);

                    // wbp
                    var wbpString = dataResult.substring(35, 43);
                    var splitData = wbpString.match(/.{1,4}/g);
                    var reverse = splitData[1] + splitData[0];
                    var wbp = hexToFloat.HexToFloat(reverse);

                    // lwbp
                    var lwbpString = dataResult.substring(43, 51);
                    var splitData = lwbpString.match(/.{1,4}/g);
                    var reverse = splitData[1] + splitData[0];
                    var lwbp = hexToFloat.HexToFloat(reverse);

                    // ir
                    var irString = dataResult.substring(51, 59);
                    var splitData = irString.match(/.{1,4}/g);
                    var reverse = splitData[1] + splitData[0];
                    var ir = hexToFloat.HexToFloat(reverse);

                    // is
                    var isString = dataResult.substring(59, 67);
                    var splitData = isString.match(/.{1,4}/g);
                    var reverse = splitData[1] + splitData[0];
                    var is = hexToFloat.HexToFloat(reverse);

                    // it
                    var itString = dataResult.substring(67, 75);
                    var splitData = itString.match(/.{1,4}/g);
                    var reverse = splitData[1] + splitData[0];
                    var it = hexToFloat.HexToFloat(reverse);

                    // freq
                    var freqString = dataResult.substring(75, 83);
                    var splitData = freqString.match(/.{1,4}/g);
                    var reverse = splitData[1] + splitData[0];
                    var freq = hexToFloat.HexToFloat(reverse);

                    // vartot
                    var vartotString = dataResult.substring(83, 91);
                    var splitData = vartotString.match(/.{1,4}/g);
                    var reverse = splitData[1] + splitData[0];
                    var vartot = hexToFloat.HexToFloat(reverse);

                    // vatot
                    var vatotString = dataResult.substring(91, 99);
                    var splitData = vatotString.match(/.{1,4}/g);
                    var reverse = splitData[1] + splitData[0];
                    var vatot = hexToFloat.HexToFloat(reverse);

                    // vr
                    var vrString = dataResult.substring(99, 107);
                    var splitData = vrString.match(/.{1,4}/g);
                    var reverse = splitData[1] + splitData[0];
                    var vr = hexToFloat.HexToFloat(reverse);

                    // vs
                    var vsString = dataResult.substring(107, 115);
                    var splitData = vsString.match(/.{1,4}/g);
                    var reverse = splitData[1] + splitData[0];
                    var vs = hexToFloat.HexToFloat(reverse);

                    // vt
                    var vtString = dataResult.substring(115, 123);
                    var splitData = vtString.match(/.{1,4}/g);
                    var reverse = splitData[1] + splitData[0];
                    var vt = hexToFloat.HexToFloat(reverse);

                    // wr
                    var wrString = dataResult.substring(123, 131);
                    var splitData = wrString.match(/.{1,4}/g);
                    var reverse = splitData[1] + splitData[0];
                    var wr = hexToFloat.HexToFloat(reverse);

                    // ws
                    var wsString = dataResult.substring(131, 139);
                    var splitData = wsString.match(/.{1,4}/g);
                    var reverse = splitData[1] + splitData[0];
                    var ws = hexToFloat.HexToFloat(reverse);

                    // wt
                    var wtString = dataResult.substring(139, 147);
                    var splitData = wtString.match(/.{1,4}/g);
                    var reverse = splitData[1] + splitData[0];
                    var wt = hexToFloat.HexToFloat(reverse);

                    // varr
                    var varrString = dataResult.substring(147, 155);
                    var splitData = varrString.match(/.{1,4}/g);
                    var reverse = splitData[1] + splitData[0];
                    var varr = hexToFloat.HexToFloat(reverse);

                    // vars
                    var varsString = dataResult.substring(155, 163);
                    var splitData = varsString.match(/.{1,4}/g);
                    var reverse = splitData[1] + splitData[0];
                    var vars = hexToFloat.HexToFloat(reverse);

                    // vart
                    var vartString = dataResult.substring(163, 171);
                    var splitData = vartString.match(/.{1,4}/g);
                    var reverse = splitData[1] + splitData[0];
                    var vart = hexToFloat.HexToFloat(reverse);

                    // var
                    var VarString = dataResult.substring(171, 179);
                    var splitData = VarString.match(/.{1,4}/g);
                    var reverse = splitData[1] + splitData[0];
                    var Var = hexToFloat.HexToFloat(reverse);

                    // vas
                    var vasString = dataResult.substring(179, 187);
                    var splitData = vasString.match(/.{1,4}/g);
                    var reverse = splitData[1] + splitData[0];
                    var vas = hexToFloat.HexToFloat(reverse);

                    // vat
                    var vatString = dataResult.substring(187, 195);
                    var splitData = vatString.match(/.{1,4}/g);
                    var reverse = splitData[1] + splitData[0];
                    var vat = hexToFloat.HexToFloat(reverse);

                    // pf
                    var pf = wtot / vatot;

                    connection.query("INSERT INTO result (jenis, in_out, device_id, date_kwh, kwh, wtot, wbp, lwbp, ir, _is, it, freq, vartot, vatot, vr, vs, vt, wr, ws, wt, varr, vars, vart, var, vas, vat, pf) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [jenis, in_out, deviceId, dateTime, kwh, wtot, wbp, lwbp, ir, is, it, freq, vartot, vatot, vr, vs, vt, wr, ws, wt, varr, vars, vart, Var, vas, vat, pf], function (err, result, fields) {
                        if (err) throw err;
                    });

                    // getSubstr = splitFunc.splitInto(splitFunc.getApart(splitRawData[index]), 8);
                    // for (let i = 0; i < getSubstr.length; i++) {
                    //     const getSubs = getSubstr[i];
                    //     var splitData = getSubs.match(/.{1,4}/g);
                    //     var reverse = splitData[1]+splitData[0];
                    //     var hex = hexToFloat.HexToFloat(reverse);
                    //     console.log(hex);
                    // }


                }
            }
        });
    })

    server.listen(9000, function () {
        console.log(`Worker ${process.pid} started`)
    })
}