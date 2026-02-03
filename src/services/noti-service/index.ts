import { NatsService } from "../nats";
import { JetStreamClient, jwtAuthenticator, StreamInfo } from "nats";
import { logger as winstonLogger } from "../../utils/logger";

const NOTI_SUBJECTS = {
  EMAIL: "noti.email",
  SMS: "noti.sms",
  PUSH: "noti.push",
};

export class NotiService {
  private static instance: NotiService;
  private natsService!: NatsService;
  private notiStream!: JetStreamClient;
  private logger = winstonLogger.child({
    service: "NotiService",
  });

  static getInstance() {
    if (!NotiService.instance) {
      NotiService.instance = new NotiService();
    }
    return NotiService.instance;
  }

  static async init() {
    this.instance = new NotiService();
    this.instance.natsService = new NatsService();

    // Convert the NKey seed string to a Uint8Array
    const seed = new TextEncoder().encode(process.env.NATS_NKEY_SEED as string);

    await this.instance.natsService.connect({
      servers: [process.env.NATS_URL as string],
      authenticator: jwtAuthenticator(process.env.NATS_USER_JWT as string, seed),
    });

    this.instance.notiStream = this.instance.natsService.getJetStreamClient();
  }

  async sendNotification(subject: string, data: any) {
    const ack = await this.notiStream.publish(subject, JSON.stringify(data));
    if (ack) {
      this.logger.info(`Published data to noti service`);
    }
  }

  async sendEmail(data: any) {
    try {
      const ack = await this.notiStream.publish(NOTI_SUBJECTS.EMAIL, JSON.stringify(data));
      if (ack) {
        this.logger.info(`Published data to noti service`);
      }
    } catch (error) {
      this.logger.error(error);
    }
  }

  async sendPush(data: any) {
    const ack = await this.notiStream.publish(NOTI_SUBJECTS.PUSH, JSON.stringify(data));
    if (ack) {
      this.logger.info(`Published data to noti service`);
    }
  }
}
