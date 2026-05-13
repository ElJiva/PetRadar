import winston from 'winston';
import * as appInsights from 'applicationinsights';
import { envs } from './envs';

const isAppInsightsEnabled =
  envs.APPINSIGHTS_CONNECTION_STRING !== 'none' &&
  envs.APPINSIGHTS_CONNECTION_STRING.startsWith('InstrumentationKey');

if (isAppInsightsEnabled) {
  appInsights
    .setup(envs.APPINSIGHTS_CONNECTION_STRING)
    .setAutoCollectConsole(false)
    .setSendLiveMetrics(true)
    .start();
}

const aiClient = isAppInsightsEnabled ? appInsights.defaultClient : null;

const transports: winston.transport[] = [new winston.transports.Console()];

if (aiClient) {
  const appInsightsTransport = new winston.transports.Console({
    level: 'info',
    format: winston.format.printf(({ level, message, timestamp }) => {
      aiClient.trackTrace({
        message: `[${level}] ${message}`,
        properties: { timestamp },
      });
      return `${timestamp} [${level}] ${message}`;
    }),
  });
  transports.push(appInsightsTransport);
}

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports,
});
