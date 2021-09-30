import Config from '@ioc:Adonis/Core/Config'
import mysqldump from 'mysqldump'
import logger from '@ioc:Adonis/Core/Logger'
import FileToProcess from 'App/Utilities/FileToProcess'

export default class DatabaseDumper {
  private file: FileToProcess

  constructor(file: FileToProcess) {
    this.file = file
  }

  public async run() {
    logger.info('Starting Database dump...')
    await this.dumpDatabase()
    logger.info('Finished Database dump...')
  }

  private async dumpDatabase() {
    return await mysqldump({
      connection: {
        host: Config.get('database.connections.mysql.connection.host'),
        port: Config.get('database.connections.mysql.connection.port'),
        user: Config.get('database.connections.mysql.connection.user'),
        password: Config.get('database.connections.mysql.connection.password'),
        database: Config.get('database.connections.mysql.connection.database'),
      },
      dumpToFile: this.file.getFile(true, 'sql'),
    })
  }
}
