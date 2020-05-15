module.exports = {
    splitInto: function splitInto(str, len) {
        var regex = new RegExp('.{' + len + '}|.{1,' + Number(len-1) + '}', 'g');
        return str.match(regex );
    },
    getApart: function getApart(substr) {
        var subs = substr.substring(0, 19)
        return substr.split(subs)[1];
    }
}