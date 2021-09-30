export default class FileToProcess {
  private filePath: string
  private fileName: string

  constructor(filePath: string, fileName: string, addTimestamp: boolean = true) {
    this.filePath = filePath
    this.fileName = addTimestamp ? this.addTimestamp(fileName) : fileName
  }

  public getFile(includePath: boolean, extension: string) {
    return (includePath ? this.filePath : '') + this.fileName + `.${extension}`
  }

  private addTimestamp(fileName: string) {
    const date = new Date(Date.now())

    return (
      fileName +
      `_${date.toISOString().split('T')[0].replace(/-/g, '_')}` +
      '_' +
      `${date.toTimeString().split(' ')[0].replace(/:/g, '_')}`
    )
  }
}
