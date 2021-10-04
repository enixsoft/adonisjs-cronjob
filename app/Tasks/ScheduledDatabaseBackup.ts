import { BaseTask } from 'adonis5-scheduler/build'
import Env from '@ioc:Adonis/Core/Env'
import Backup from 'App/Utilities/Backup'
import DatabaseExporter from 'App/Helpers/DatabaseExporter'
import Zipper from 'App/Helpers/Zipper'
import SlackNotifier from 'App/Helpers/SlackNotifier'
import S3Uploader from 'App/Helpers/S3Uploader'
import Logger from '@ioc:Adonis/Core/Logger'

export default class ScheduledDatabaseBackup extends BaseTask {
  public static get schedule() {
    return Env.get('CRON_SCHEDULE', '0 0 7 * * *')
  }

  /**
   * Set enable use .lock file for block run retry task
   * Lock file save to `build/tmpTaskLock`
   */
  public static get useLock() {
    return false
  }

  public async handle() {
    Logger.info('Starting scheduled database backup...')

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
      Logger.info(success)
    } catch (err) {
      const error =
        'ERROR: Database backup ' + backup.getFile(false, '') + ' has failed with error: ' + err

      slackNotifier.notify(error)
      Logger.error(error)
    }
    Logger.info('Finished scheduled database backup.')
  }
}
