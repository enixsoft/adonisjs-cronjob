import archiver from 'archiver'
import fs from 'fs'
import logger from '@ioc:Adonis/Core/Logger'
import FileToProcess from 'App/Utilities/FileToProcess'

export default class Zipper {
  private file: FileToProcess

  constructor(file: FileToProcess) {
    this.file = file
  }

  public async run() {
    logger.info('Starting zip archive...')
    await this.zipFile()
    logger.info('Finished zip archive...')
  }

  public zipFile() {
    return new Promise<void>((resolve, reject) => {
      const output = fs.createWriteStream(this.file.getFile(true, 'zip'))
      const archive = archiver('zip', {
        zlib: { level: 9 },
      })

      const error = (err) => {
        reject(err)
        // output.on('close', () => {
        // 	fs.unlink(this.file.getFile(true, 'zip'),
        // 	(err) => { if (err) throw err })
        // });
        // output.end();
      }

      output.on('close', function () {
        logger.info('ZIP archive has ' + archive.pointer() + ' total bytes.')
        resolve()
        output.end()
      })

      archive.on('error', error)
      // pipe archive data to the file
      archive.pipe(output)
      archive.append(fs.createReadStream(this.file.getFile(true, 'sql')), {
        name: this.file.getFile(false, 'sql'),
      })
      archive.finalize()
    })
  }
}
