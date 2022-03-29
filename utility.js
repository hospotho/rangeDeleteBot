"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timeString = exports.msToMinSec = exports.hashCode = exports.sleep = void 0;
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
exports.sleep = sleep;
function hashCode(str) {
    var hash = 0;
    if (str.length === 0)
        return hash;
    for (var i = 0; i < str.length; i++) {
        hash = hash * 31 + str.charCodeAt(i);
        hash |= 0;
    }
    return hash;
}
exports.hashCode = hashCode;
function msToMinSec(ms) {
    let min = Math.floor(ms / 60000);
    let sec = Math.floor((ms % 60000) / 1000);
    return (min > 0 ? min + 'm' : '') + (sec < 10 && min > 0 ? '0' : '') + sec + 's';
}
exports.msToMinSec = msToMinSec;
function timeString() {
    var time = new Date();
    const month = time.getMonth() + 1;
    const day = time.getDate();
    const hour = time.getHours();
    const min = time.getMinutes();
    const string = (month > 9 ? '' : '0') +
        month +
        '/' +
        (day > 9 ? '' : '0') +
        day +
        '  ' +
        (hour > 9 ? '' : '0') +
        hour +
        ':' +
        (min > 9 ? '' : '0') +
        min;
    return string;
}
exports.timeString = timeString;
