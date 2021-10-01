import fs from 'fs'
import Drive, { S3DriverContract } from '@ioc:Adonis/Core/Drive'
import logger from '@ioc:Adonis/Core/Logger'
import FileToProcess from 'App/Utilities/FileToProcess'
import Env from '@ioc:Adonis/Core/Env'

export default class S3Uploader {
  private file: FileToProcess

  private s3: S3DriverContract

  private s3Path: string

  private deleteAfterUpload: boolean

  constructor(file: FileToProcess) {
    this.file = file
    this.s3 = Drive.use('s3')
    this.s3Path = Env.get('S3_PATH', './')
    this.deleteAfterUpload = Env.get('DELETE_BACKUPS_AFTER_UPLOAD', false)
  }

  public async run() {
    logger.info('Starting uploading to AWS S3...')
    await this.uploadToS3()
    logger.info('Finished uploading to AWS S3...')
  }

  public async uploadToS3() {
    // Creates a readable stream from file
    const fileStream = await fs.createReadStream(this.file.getFile(true, 'zip'))

    // Uploads the file to Amazon S3
    const s3Path = `${this.s3Path}${this.file.getFile(false, 'zip')}`
    await this.s3.putStream(s3Path, fileStream)
    // const fileUrl = await this.s3.getUrl(s3Path)

    // Destroy the readable stream
    fileStream.destroy()

    if (this.deleteAfterUpload) {
      fs.unlink(this.file.getFile(true, 'zip'), (err) => {
        if (err) throw err
        logger.info(`${this.file.getFile(true, 'sql')} was deleted.`)
      })
      fs.unlink(this.file.getFile(true, 'sql'), (err) => {
        if (err) throw err
        logger.info(`${this.file.getFile(true, 'sql')} was deleted.`)
      })
    }
  }
}
