import Config from '@ioc:Adonis/Core/Config'
import mysqldump from 'mysqldump'
import Logger from '@ioc:Adonis/Core/Logger'
import Backup from 'App/Utilities/Backup'
import fs from 'fs'
import { Client } from 'ssh2'
import Env from '@ioc:Adonis/Core/Env'

export default class DatabaseExporter {
  private catchMysqlDumpErrors: Array<string> = [
    `mysqldump: [Warning] Using a password on the command line interface can be insecure.\n`,
    `mysqldump: Error: 'Access denied; you need (at least one of) the PROCESS privilege(s) for this operation' when trying to dump tablespaces\n`,
  ]

  private backup: Backup

  constructor(backup: Backup) {
    this.backup = backup
  }

  public async run() {
    Logger.info('Starting database export...')
    await this.dumpDatabase()
    Logger.info('Finished database export.')
  }

  private async dumpDatabase() {
    if (
      Env.get('SSH_HOST') &&
      Env.get('SSH_PORT') &&
      Env.get('SSH_USERNAME') &&
      Env.get('SSH_PASSWORD')
    ) {
      return this.dumpRemoteDatabase()
    } else {
      return this.dumpLocalDatabase()
    }
  }

  private async dumpLocalDatabase() {
    return await mysqldump({
      connection: {
        host: Config.get('database.connections.mysql.connection.host'),
        port: Config.get('database.connections.mysql.connection.port'),
        user: Config.get('database.connections.mysql.connection.user'),
        password: Config.get('database.connections.mysql.connection.password'),
        database: Config.get('database.connections.mysql.connection.database'),
      },
      dumpToFile: this.backup.getFile(true, 'sql'),
    })
  }

  private async dumpRemoteDatabase() {
    return new Promise<void>((resolve, reject) => {
      const writeStream = fs.createWriteStream(this.backup.getFile(true, 'sql'))

      const mysqlDumpCmd =
        `mysqldump -h ${Config.get('database.connections.mysql.connection.host')} ` +
        `-P ${Config.get('database.connections.mysql.connection.port')} ` +
        `-u ${Config.get('database.connections.mysql.connection.user')} ` +
        `-p${Config.get('database.connections.mysql.connection.password')} ` +
        `${Config.get('database.connections.mysql.connection.database')}`

      const conn = new Client()
      conn
        .on('ready', () => {
          conn.exec(mysqlDumpCmd, (err, stream) => {
            if (err) throw err
            stream
              .on('close', () => {
                conn.end()
              })
              .stdout.pipe(writeStream)
              .on('finish', function () {
                resolve()
              })
              .on('error', function (err) {
                reject(err)
              })
            stream.stderr.on('data', (data) => {
              const error = data.toString()
              if (!this.catchMysqlDumpErrors.includes(error)) {
                reject(error)
              }
            })
          })
        })
        .connect({
          host: Env.get('SSH_HOST'),
          port: Env.get('SSH_PORT'),
          username: Env.get('SSH_USERNAME'),
          password: Env.get('SSH_PASSWORD'),
        })
    })
  }
}
