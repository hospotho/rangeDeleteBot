"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.diff = exports.timeString = exports.msToMinSec = exports.text2price = exports.html2text = exports.hashCode = exports.sleep = void 0;
const jsDiff = __importStar(require("diff"));
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
function html2text(str) {
    return str
        .replaceAll('<br>', '\n')
        .replaceAll('&nbsp;', ' ')
        .replaceAll(/<[^>]*>/g, '');
}
exports.html2text = html2text;
function text2price(str) {
    var result = '';
    var arr = str.split('\n');
    arr.forEach(text => {
        if (text.match(/\d{3}/) && !text.startsWith('https://uploadcdn.8591.com.tw')) {
            result += text + '\n';
        }
    });
    return result;
}
exports.text2price = text2price;
function msToMinSec(ms) {
    let min = Math.floor(ms / 60000);
    let sec = Math.floor((ms % 60000) / 1000);
    return (min > 0 ? min + 'm' : '') + (sec < 10 && min > 0 ? '0' : '') + sec + 's';
}
exports.msToMinSec = msToMinSec;
function timeString(ms = 0) {
    if (ms === 0) {
        var time = new Date();
    }
    else {
        var time = new Date(ms);
    }
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
function diff(oldStr, newStr) {
    const diff = jsDiff.diffLines(oldStr, newStr);
    var result = '';
    diff.forEach(line => {
        if (line.removed) {
            result += line.value + ' ->\n';
        }
        if (line.added) {
            result += line.value + '\n';
        }
    });
    return result;
}
exports.diff = diff;
