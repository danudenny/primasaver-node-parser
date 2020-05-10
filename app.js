const HexToFloat32 = (str) => {
    var int = parseInt(str, 16);
    if (int > 0 || int < 0) {
        var sign = (int >>> 31) ? -1 : 1;
        var exp = (int >>> 23 & 0xff) - 127;
        var mantissa = ((int & 0x7fffff) + 0x800000).toString(2);
        var float32 = 0
        for (i = 0; i < mantissa.length; i += 1) { float32 += parseInt(mantissa[i]) ? Math.pow(2, exp) : 0; exp-- }
        return float32 * sign;
    } else return 0
}

function splitInto(str, len) {
    var regex = new RegExp('.{' + len + '}|.{1,' + Number(len-1) + '}', 'g');
    return str.match(regex );
}

function getApart(substr) {
	var subs = substr.substring(0, 19)
    return substr.split(subs)[1];
}

var rawData = 'ED160dc4e8b0e872da8000042ba0000456d000041a8000042901cac402a893741298f5c40ca851f424780004462d0004589333343c2400043c2f33343c30000440d800045028000448e0000430400000000000044400000441360004516400044b0ED261284e8b0e8b2da8000042bae000456e000041b00000428e81064025c28f412d24dd40c6851f4247800044656000458a400043c2333343c2f33343c3800044086000450740004489000043040000000000004443000044108000451a400044ad';
var splitRawData = rawData.match(/.{1,195}/g);

if(rawData.length != 390) {
    console.log('Not Complete Data');
} else {
    for (let index = 0; index < splitRawData.length; index++) {
        const dataResult = splitRawData[index];
        // Jenis
        var jenis = dataResult.substring(0, 2);
        if (jenis == 'ED') {
            console.log('EDMI')
        };

        // In Out
        var in_out = dataResult.substring(2, 3);
        if (in_out == 1) {
            console.log('Incoming')
        } else {
            console.log('Outgoing')
        }

        // Device ID
        var deviceId = dataResult.substring(2, 11);
        console.log(deviceId)

        // DateTime
        var dateTime = dataResult.substring(11, 19);
        console.log(dateTime)

        getSubstr = splitInto(getApart(splitRawData[index]), 8);
        for (let i = 0; i < getSubstr.length; i++) {
            const getSubs = getSubstr[i];
            var splitData = getSubs.match(/.{1,4}/g);
            var reverse = splitData[1]+splitData[0];
            var hex = HexToFloat32(reverse);
            console.log(hex);
        }
    }
}

