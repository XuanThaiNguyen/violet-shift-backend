import winston from "winston";

export const logger = winston.createLogger({
  format: winston.format.printf(({ level, message, ...meta }) => {
    const timestamp = Date.now();
    return `${timestamp} [${level}] meta: ${JSON.stringify(meta)} - ${message} `;
  }),
  // Set up elastic search transport here, or log into argo cd logs
  transports: [
    // new winston.transports.Elasticsearch({
    //   node: process.env.ELASTICSEARCH_NODE,
    //   index: process.env.ELASTICSEARCH_INDEX,
    //   type: process.env.ELASTICSEARCH_TYPE,
    // }),
    new winston.transports.Console(),
  ],
});
