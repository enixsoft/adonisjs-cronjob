import { BaseCommand } from '@adonisjs/core/build/standalone'
import DatabaseDumper from 'App/Helpers/DatabaseDumper'
import Zipper from 'App/Helpers/Zipper'
import FileToProcess from 'App/Utilities/FileToProcess'
import S3Uploader from 'App/Helpers/S3Uploader'

export default class DatabaseBackup extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'database:backup'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'Backs up the configured database'

  public static settings = {
    /**
     * Set the following value to true, if you want to load the application
     * before running the command
     */
    loadApp: true,

    /**
     * Set the following value to true, if you want this command to keep running until
     * you manually decide to exit the process
     */
    stayAlive: false,
  }

  public async run() {
    this.logger.info('Starting Database Backup...')

    const fileToProcess = new FileToProcess('./', 'db_backup')

    try {
      await new DatabaseDumper(fileToProcess).run()
      await new Zipper(fileToProcess).run()
      await new S3Uploader(fileToProcess).run()
    } catch (err) {
      // send errors to slack
    }
    this.logger.info('Finished Database Backup...')
  }
}
