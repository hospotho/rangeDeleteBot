export class logStack {
  logs: Array<string>
  maxsize: number
  private static logger: logStack

  private constructor(_size: number) {
    this.logs = []
    this.maxsize = _size
  }

  public static getLogger(_size: number = 50) {
    if (!logStack.logger) {
      logStack.logger = new logStack(_size)
    }
    return logStack.logger
  }

  logging(str: string) {
    if (this.logs.length === this.maxsize) this.logs.shift()
    this.logs.push(str)
    console.log(str)
  }
  getLog(size: number) {
    return this.logs.slice(Math.max(this.logs.length - size, 0))
  }
  clear() {
    this.logs = []
  }
}

export class dataPool {
  link: Array<string>
  title: Array<string>
  info: Array<string>
  hash: Array<number>
  date: Array<number>
  private static dataPool: dataPool

  private constructor() {
    this.link = []
    this.title = []
    this.info = []
    this.hash = []
    this.date = []
  }

  public static getDataPool() {
    if (!dataPool.dataPool) {
      dataPool.dataPool = new dataPool()
    }
    return dataPool.dataPool
  }

  public static getEmptyDataPool() {
    return new dataPool()
  }

  public static setNewDataPool(_dataPool: dataPool) {
    if (dataPool.dataPool) {
      dataPool.dataPool = _dataPool
    }
  }
}
