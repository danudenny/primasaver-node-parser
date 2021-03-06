var net = require("net");
let mysql = require('mysql');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

var hexToFloat = require('./utils/hexToFloat');
var hexToDec = require('./utils/hexToDec');
var log = require('./config/winston');
let config = require('./config/database');
const { exit } = require("process");

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
            var workerId = `Worker ${process.pid}`;
            var getLength = rawData.length;
            
            var deviceIdLog = rawData.substring(2, 11);
            var jenisLog = rawData.substring(0, 2);
            console.log(deviceIdLog)

            if (rawData.length != 585) {
                console.log('Not Complete Data');
                connection.query("INSERT INTO parse_result (parse, type, status, cluster, client_ip, data_length) VALUES (?, ?, 'Uncompleted Data', ?, ?, ?)", [rawData, jenisLog, workerId, remoteAddress, getLength], function (err, result, fields) {
                    if (err) throw err;
                });
            } else if (raw == 0) {
                console.log('Empty Data');
                connection.query("INSERT INTO parse_result (parse, type, status, cluster, client_ip, data_length) VALUES (?, ?, 'Empty / No Data', ?, ?, ?)", [rawData, jenisLog, workerId, remoteAddress, getLength], function (err, result, fields) {
                    if (err) throw err;
                });
            } else if (rawData.length == 195) {
                console.log('Receive 1 Data');
                connection.query("INSERT INTO parse_result (parse, type, status, cluster, client_ip, data_length) VALUES (?, ?, 'Receive 1 Data Only', ?, ?, ?)", [rawData, jenisLog, workerId, remoteAddress, getLength], function (err, result, fields) {
                    if (err) throw err;
                });
            } else if (rawData.length == 390) {
                console.log('Receive 2 Data');
                connection.query("INSERT INTO parse_result (parse, type, status, cluster, client_ip, data_length) VALUES (?, ?, 'Receive 2 Data Only', ?, ?, ?)", [rawData, jenisLog, workerId, remoteAddress, getLength], function (err, result, fields) {
                    if (err) throw err;
                });
            } else {
                var splitRawData = rawData.match(/.{1,195}/g);

                for (let index = 0; index < splitRawData.length; index++) {
                    let dataResultLog = [splitRawData[index]];
                    connection.query("INSERT INTO parse_result (parse, type, status, cluster, client_ip, data_length) VALUES (?, ?, 'Success', ?, ?, ?)", [dataResultLog, jenisLog, workerId, remoteAddress, getLength], function (err, result, fields) {
                        if (err) {
                            throw err;
                        } else {
                            let logId = result['insertId'];
                            // connection.end();
                            let dataResult = splitRawData[index];
                            // Jenis
                            var jenis = dataResult.substring(0, 2);
                            if (jenis == 'ED') {
                                var jenis = 'EDMI';
                            };
        
                            // In Out
                            var in_out = dataResult.substring(2, 3);
                            if (in_out == 0) {
                                var in_out = 'travo';
                            } else if (in_out == 1) {
                                var in_out = 'in';
                            } else {
                                var in_out = 'out';
                            }
        
                            // Device ID
                            var deviceId = dataResult.substring(2, 11);
        
                            // DateTime
                            var dateTimeString = dataResult.substring(11, 19);
                            var splitData = dateTimeString.match(/.{1,4}/g);
                            var reverse = splitData[1] + splitData[0];
                            var dateHexToDec = hexToDec.HexToDec(reverse);
                            var dateDecAdd = (dateHexToDec + 820454400) - 25200;
                            var unixToDate = new Date(dateDecAdd * 1000);
                            var options = { hour12: false, timeZone: 'Asia/Jakarta' };
                            // Date
                            var dateReady = unixToDate.toISOString().split('T')[0];
                            var timeReady = unixToDate.toLocaleTimeString('id', options);
        
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
                            var pf = wtot / vatot || 0;
        
                            var today = new Date();
                            var options = { hour12: false };
        
                            // Date Server
                            var dateServerReady = today.toISOString().split('T')[0];
                            var timeServerReady = today.toLocaleTimeString([], options);
                            // console.log(dateServerReady , ' and ', dateReady);
        
                            var vrms = (vr + vs + vt) / 3;
                            var irms = (ir + is + it) / 3;
        
                            connection.query(`INSERT INTO io_ctl (date_server,time_server,date_kwh,time_kwh,device_id,IR,ISc,IT,IRMS,VR,VS,VT,VRMS,Freq,WTot,WhR,WhS,WhT,VarhTot,VarhR,VarhS,VarhT,VAhTot,VAhR,VAhS,VAhT,kwh, wbp, lwbp, pf, log_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
                                        [dateServerReady, timeServerReady, dateReady, timeReady, deviceId, ir, is, it, irms, vr, vs, vt, vrms, freq, wtot, wr, ws, wt, vartot, varr, vars, vart, vatot, Var, vas, vat, kwh, wbp, lwbp, pf, logId ], function (err, result, fields) {
                                if (err) throw err;
                            });
                        }
                    });
                    

                    // connection.query("
                    // INSERT INTO result (date_server,time_server,date_kwh,time_kwh,device_id,
                    //     IR,ISc,IT,IRMS,VR,VS,VT,VRMS,Freq,WTot,WhR,WhS,WhT,VarhTot,
                    //     VarhR,VarhS,VarhT,VAhTot,VAhR,VA) 
                    //     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 
                    //             [dateServerReady, timeServerReady, dateReady, timeReady, deviceId, ir, is, it, freq, vartot, vatot, vr, vs, vt, wr, ws, wt, varr, vars, vart, Var, vas, vat, pf], function (err, result, fields) {
                    //     if (err) throw err;
                    // });

                }
            }
        });
    })

    server.listen(9000, function () {
        console.log(`Worker ${process.pid} started`)
    })
}