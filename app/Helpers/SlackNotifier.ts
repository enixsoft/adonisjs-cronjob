import Logger from '@ioc:Adonis/Core/Logger'
import { IncomingWebhook } from '@slack/webhook'
import Env from '@ioc:Adonis/Core/Env'

export default class SlackNotifier {
  private url: string | undefined

  private webhook: IncomingWebhook | undefined

  constructor() {
    this.url = Env.get('SLACK_WEBHOOK_URL')
    this.webhook = this.url ? new IncomingWebhook(this.url) : undefined
  }

  public async notify(message: string) {
    if (this.webhook) {
      await this.webhook.send({
        text: message,
      })
    } else {
      Logger.error('ERROR: Slack Notifier is not configured properly. Message has not been sent.')
    }
  }
}
