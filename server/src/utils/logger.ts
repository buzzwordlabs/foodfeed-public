import winston from 'winston';
import { format } from 'util';
import { IS_PRODUCTION } from '../config';

winston.configure({
  transports: [
    new winston.transports.Console({
      format: !IS_PRODUCTION
        ? winston.format.combine(
            winston.format.colorize(),
            winston.format.splat(),
            winston.format.simple()
          )
        : winston.format.combine(
            winston.format.splat(),
            winston.format.simple()
          ),
      level: 'silly'
    })
  ]
});

const logFormatString = (logItem: any, args: any[]) => {
  let logArgs = '';
  const formatArg = (arg: any, addSpace?: boolean) => {
    switch (typeof arg) {
      case 'string': {
        const formatted = format('%s', arg);
        logArgs = logArgs.concat(addSpace ? ' ' + formatted : formatted);
        break;
      }
      case 'number': {
        const formatted = format('%d', arg);
        logArgs = logArgs.concat(addSpace ? ' ' + formatted : formatted);
        break;
      }
      case 'boolean': {
        const formatted = String(arg);
        logArgs = logArgs.concat(addSpace ? ' ' + formatted : formatted);
        break;
      }
      case 'object': {
        const formatted = format('%o', arg);
        logArgs = logArgs.concat(addSpace ? ' ' + formatted : formatted);
        break;
      }
      case 'undefined': {
        const formatted = 'WHATEVER WAS HERE WAS UNDEFINED';
        logArgs = logArgs.concat(addSpace ? ' ' + formatted : formatted);
        break;
      }
      default: {
        const formatted = format('%o', arg);
        logArgs = logArgs.concat(addSpace ? ' ' + formatted : formatted);
        break;
      }
    }
  };
  formatArg(logItem);
  if (args.length > 0) {
    args.map((arg) => formatArg(arg, true));
  }
  return logArgs;
};

const logOutput = (type: string, logItem: any, args: any[]) => {
  winston.log(type, logFormatString(logItem, args));
};

export const error = (arg: any, ...args: any[]) => {
  logOutput('error', arg, args);
};

export const warn = (arg: any, ...args: any[]) => {
  logOutput('warn', arg, args);
};

export const info = (arg: any, ...args: any[]) => {
  logOutput('info', arg, args);
};

export const debug = (arg: any, ...args: any[]) => {
  logOutput('debug', arg, args);
};
