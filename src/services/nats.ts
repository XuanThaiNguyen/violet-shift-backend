// import { connect, NodeConnectionOptions } from "@nats-io/transport-node";
import {
  connect,
  ConnectionOptions,
  NatsConnection,
  PubAck,
  SubscriptionOptions,
  JetStreamPublishOptions,
  JetStreamManager,
  StreamConfig,
} from "nats";
import { logger as winstonLogger } from "../utils/logger";

const NATS_URL = process.env.NATS_URL || "nats://localhost:4222";

/**
 * Options to a JetStream options applied to all  JetStream or JetStreamManager requests.
 */
export interface JetStreamOptions {
  /**
   * Prefix required to interact with JetStream. Must match
   * server configuration.
   */
  apiPrefix?: string;
  /**
   * Number of milliseconds to wait for a JetStream API request.
   * @default ConnectionOptions.timeout
   * @see ConnectionOptions.timeout
   */
  timeout?: number;
  /**
   * Name of the JetStream domain. This value automatically modifies
   * the default JetStream apiPrefix.
   */
  domain?: string;
}
export interface JetStreamManagerOptions extends JetStreamOptions {
  /**
   * Allows disabling a check on the account for JetStream enablement see
   * {@link JetStreamManager.getAccountInfo()}.
   */
  checkAPI?: boolean;
}

export class NatsService {
  private nc!: NatsConnection;
  private jsm!: JetStreamManager;
  private logger = winstonLogger.child({
    service: "Nats",
  });

  // TODO: add event listener for connection
  async connect(options: ConnectionOptions): Promise<void> {
    try {
      this.nc = await connect(options);
      this.logger.info("NATS connected");
    } catch (error) {
      this.logger.error("Error connecting to NATS:", error);
    }
  }

  // TODO: handle reconnection if there is a subscription
  async disconnect(): Promise<void> {
    try {
      await this.nc.close();
      this.logger.info("NATS disconnected");
    } catch (error) {
      this.logger.error("Error disconnecting from NATS:", error);
    }
  }

  publish(subject: string, data: any): void {
    this.nc.publish(subject, data);
    this.logger.info(`Published data to ${subject}`);
  }

  subscribe(subject: string, subscriptionOptions: SubscriptionOptions) {
    this.nc.subscribe(subject, subscriptionOptions);
  }

  async createJetStreamManager(options?: JetStreamOptions) {
    this.jsm = await this.nc.jetstreamManager(options);
    this.logger.info("JetStream manager created");
  }

  async jsmAdd(conf: Partial<StreamConfig>) {
    return this.jsm.streams.add(conf);
  }

  getJetStreamClient() {
    this.logger.info("JetStream client created");

    return this.nc.jetstream();
  }
}
