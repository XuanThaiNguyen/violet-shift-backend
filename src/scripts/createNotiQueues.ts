import {
  DiscardPolicy,
  JetStreamManager,
  jwtAuthenticator,
  RetentionPolicy,
  StorageType,
  StreamConfig,
} from "nats";
import { NatsService } from "../services/nats";
import { logger as winstonLogger } from "../utils/logger";
import { STREAM_NAMES } from "../constants/nats";

const streamsConfigs: Array<Partial<StreamConfig>> = [
  // email
  {
    name: STREAM_NAMES.EMAIL_STREAM,
    subjects: ["noti.email.*"],
    storage: StorageType.File,
    max_msg_size: 1024 * 1024, // 1Mb
    max_bytes: 1024 * 1024 * 256, // 256Mb
    max_age: 60 * 60 * 24 * 7 * 10 ** 6, // 7 days
    max_msgs_per_subject: 1,
    retention: RetentionPolicy.Workqueue,
    discard: DiscardPolicy.New,
    deny_delete: true,
    deny_purge: false,
    allow_direct: true,
  },
  {
    name: STREAM_NAMES.EMAIL_DLQ_STREAM,
    subjects: [`$JS.EVENT.ADVISORY.CONSUMER.MAX_DELIVERIES.${STREAM_NAMES.EMAIL_STREAM}.*`],
    storage: StorageType.File,
    max_msg_size: 1024 * 1024, // 1Mb
    max_bytes: 1024 * 1024 * 256, // 256Mb
    max_age: 60 * 60 * 24 * 7 * 10 ** 6, // 7 days
    max_msgs_per_subject: 1,
    retention: RetentionPolicy.Workqueue,
    discard: DiscardPolicy.New,
    deny_delete: true,
    deny_purge: false,
    allow_direct: true,
  },

  // push
  {
    name: STREAM_NAMES.PUSH_STREAM,
    subjects: ["noti.push.*"],
    storage: StorageType.File,
    max_msg_size: 1024 * 1024, // 1Mb
    max_bytes: 1024 * 1024 * 256, // 256Mb
    max_age: 60 * 60 * 24 * 7 * 10 ** 6, // 7 days
    max_msgs_per_subject: 1,
    retention: RetentionPolicy.Workqueue,
    discard: DiscardPolicy.New,
    deny_delete: true,
    deny_purge: false,
    allow_direct: true,
  },
  {
    name: STREAM_NAMES.PUSH_DLQ_STREAM,
    subjects: [`$JS.EVENT.ADVISORY.CONSUMER.MAX_DELIVERIES.${STREAM_NAMES.PUSH_STREAM}.*`],
    storage: StorageType.File,
    max_msg_size: 1024 * 1024, // 1Mb
    max_bytes: 1024 * 1024 * 256, // 256Mb
    max_age: 60 * 60 * 24 * 7 * 10 ** 6, // 7 days
    max_msgs_per_subject: 1,
    retention: RetentionPolicy.Workqueue,
    discard: DiscardPolicy.New,
    deny_delete: true,
    deny_purge: false,
    allow_direct: true,
  },
];

async function main() {
  const logger = winstonLogger.child({
    service: "createNotiQueues",
  });
  // authenticate NATs
  const natsService = new NatsService();
  // Convert the NKey seed string to a Uint8Array
  const seed = new TextEncoder().encode(process.env.NATS_NKEY_SEED as string);
  try {
    await natsService.connect({
      servers: [process.env.NATS_URL as string],
      authenticator: jwtAuthenticator(process.env.NATS_USER_JWT as string, seed),
    });
    logger.info("NATS connected");
  } catch (error) {
    logger.error("NATS connection failed", error);
    return;
  }

  let jsm: JetStreamManager;
  try {
    jsm = await natsService.createJetStreamManager();
  } catch (error) {
    logger.error("JetStream manager creation failed", error);
    return;
  }
  const createStreamPromises = streamsConfigs.map((conf) => {
    return jsm.streams.add(conf);
  });

  const results = await Promise.allSettled(createStreamPromises);
  results.forEach((result) => {
    if (result.status === "fulfilled") {
      logger.info(`Stream ${result.value.config.name} created`);
    } else {
      logger.error(`Stream creation failed`, result.reason);
    }
  });

  return process.exit(0);
}

main();
