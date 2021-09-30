import { BaseTask } from 'adonis5-scheduler/build'
import logger from '@ioc:Adonis/Core/Logger'

export default class ScheduledDatabaseBackup extends BaseTask {
  public static get schedule() {
    return '* * * * * *'
  }

  /**
   * Set enable use .lock file for block run retry task
   * Lock file save to `build/tmpTaskLock`
   */
  public static get useLock() {
    return false
  }

  public async run() {
    logger.info('Starting scheduled database backup...')
  }
}
