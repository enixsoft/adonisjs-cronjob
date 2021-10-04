import archiver from 'archiver'
import fs from 'fs'
import Logger from '@ioc:Adonis/Core/Logger'
import Backup from 'App/Utilities/Backup'
import Env from '@ioc:Adonis/Core/Env'

export default class Zipper {
  private backup: Backup

  constructor(backup: Backup) {
    this.backup = backup
  }

  public async run() {
    Logger.info('Starting ZIP archive...')
    await this.zipFile()
    Logger.info('Finished ZIP archive.')
  }

  public zipFile() {
    return new Promise<void>((resolve, reject) => {
      const output = fs.createWriteStream(this.backup.getFile(true, 'zip'))
      const options = { zlib: { level: 9 }, password: Env.get('BACKUP_PASSWORD') }

      if (options.password && !archiver.isRegisteredFormat('zip-encryptable')) {
        archiver.registerFormat('zip-encryptable', require('archiver-zip-encryptable'))
      }

      const archive = archiver(options.password ? 'zip-encryptable' : 'zip', options)

      const error = (err) => {
        reject(err)
      }

      output.on('close', function () {
        Logger.info('ZIP archive has ' + archive.pointer() + ' total bytes.')
        if (options.password) {
          Logger.info('ZIP archive has been encrypted.')
        }
        resolve()
        output.end()
      })

      archive.on('error', error)
      // pipe archive data to the file
      archive.pipe(output)
      archive.append(fs.createReadStream(this.backup.getFile(true, 'sql')), {
        name: this.backup.getFile(false, 'sql'),
      })
      archive.finalize()
    })
  }
}
