import fs from 'fs'
import Drive, { S3DriverContract } from '@ioc:Adonis/Core/Drive'
import Logger from '@ioc:Adonis/Core/Logger'
import Backup from 'App/Utilities/Backup'
import Env from '@ioc:Adonis/Core/Env'

export default class S3Uploader {
  private backup: Backup

  private s3: S3DriverContract

  private s3Path: string

  private deleteAfterUpload: boolean

  constructor(backup: Backup) {
    this.backup = backup
    this.s3 = Drive.use('s3')
    this.s3Path = Env.get('S3_PATH', './')
    this.deleteAfterUpload = Env.get('DELETE_BACKUPS_AFTER_UPLOAD', false)
  }

  public async run() {
    Logger.info('Starting upload to AWS S3...')
    await this.uploadToS3()
    Logger.info('Finished upload to AWS S3.')
  }

  public async uploadToS3() {
    const fileStream = await fs.createReadStream(this.backup.getFile(true, 'zip'))

    const s3Path = `${this.s3Path}${this.backup.getFile(false, 'zip')}`
    await this.s3.putStream(s3Path, fileStream)
    // const fileUrl = await this.s3.getUrl(s3Path)

    fileStream.destroy()

    if (this.deleteAfterUpload) {
      fs.unlink(this.backup.getFile(true, 'zip'), (err) => {
        if (err) throw err
        Logger.info(`${this.backup.getFile(true, 'zip')} was deleted.`)
      })
      fs.unlink(this.backup.getFile(true, 'sql'), (err) => {
        if (err) throw err
        Logger.info(`${this.backup.getFile(true, 'sql')} was deleted.`)
      })
    }
  }
}
