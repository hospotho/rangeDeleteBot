import * as jsDiff from 'diff'

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function hashCode(str: string): number {
  var hash = 0
  if (str.length === 0) return hash
  for (var i = 0; i < str.length; i++) {
    hash = hash * 31 + str.charCodeAt(i)
    hash |= 0 // Convert to 32bit integer
  }
  return hash
}

export function html2text(str: string): string {
  return str
    .replaceAll('<br>', '\n')
    .replaceAll('&nbsp;', ' ')
    .replaceAll(/<[^>]*>/g, '')
}

export function text2price(str: string): string {
  var result = ''
  var arr = str.replaceAll(/\n+/g, '\n').split('\n')
  arr.forEach(text => {
    if (text.match(/\d{3}/) && !text.startsWith('https://uploadcdn.8591.com.tw')) {
      result += text + '\n'
    }
  })
  return result
}

export function text2view(str: string): string {
  var result = str
  const regex = /https:\/\/uploadcdn\.8591\.com\.tw\/.+/g
  result = result.replace(regex, '')
  result = result.trim()
  result = result.replaceAll(/\n+/g, '\n')
  return result.substring(0, 900)
}

export function msToMinSec(ms: number) {
  let min = Math.floor(ms / 60000)
  let sec = Math.floor((ms % 60000) / 1000)
  return (min > 0 ? min + 'm' : '') + (sec < 10 && min > 0 ? '0' : '') + sec + 's'
}

export function timeString(ms: number = 0) {
  if (ms === 0) {
    var time = new Date()
  } else {
    var time = new Date(ms)
  }
  const month = time.getMonth() + 1
  const day = time.getDate()
  const hour = time.getHours()
  const min = time.getMinutes()
  const string = (month > 9 ? '' : '0') + month + '/' + (day > 9 ? '' : '0') + day + '  ' + (hour > 9 ? '' : '0') + hour + ':' + (min > 9 ? '' : '0') + min
  return string
}

export function diff(oldStr: string, newStr: string) {
  const diff = jsDiff.diffLines(oldStr, newStr)
  var result = ''
  diff.forEach(line => {
    if (line.removed) {
      result += line.value + ' ->\n'
    }
    if (line.added) {
      result += line.value + '\n'
    }
  })
  return result
}
