import { BaseCommand } from '@adonisjs/core/build/standalone'
import DatabaseExporter from 'App/Helpers/DatabaseExporter'
import Zipper from 'App/Helpers/Zipper'
import Backup from 'App/Utilities/Backup'
import S3Uploader from 'App/Helpers/S3Uploader'
import SlackNotifier from 'App/Helpers/SlackNotifier'
import Env from '@ioc:Adonis/Core/Env'

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

    const backup = new Backup(
      Env.get('BACKUP_LOCAL_PATH', './'),
      Env.get('BACKUP_NAME', 'db_backup')
    )
    const slackNotifier = new SlackNotifier()

    try {
      await new DatabaseExporter(backup).run()
      await new Zipper(backup).run()
      await new S3Uploader(backup).run()

      const success =
        'SUCCESS: Database backup ' + backup.getFile(false, '') + ' has been created and uploaded.'

      slackNotifier.notify(success)
      this.logger.success(success)
    } catch (err) {
      const error =
        'ERROR: Database backup ' + backup.getFile(false, '') + ' has failed with error: ' + err

      slackNotifier.notify(error)
      this.logger.error(error)
    }
    this.logger.info('Finished Database Backup.')
  }
}
