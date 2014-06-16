/*global describe:true,it:true*/

var loggers = require('../lib/logger');

describe('logger', function() {
  describe('#configure', function() {
    it('can configure', function(done) {
      loggers.configure({
        appenders: {
          con: {
            type: 'console'
          }
        },
        loggers: {
          category1: {
            appenders: ['con']
          }
        }
      });
      var logger = loggers.get('category1');
      logger.info('test test test');
      logger.error('test test test', new Error("YOYO"));
      logger.warn('test test test');
      logger.debug('test test test', { test: 'value' });
      logger.fatal('test test test');
      done();
    });

    it('can jsonLayout', function(done) {
      loggers.configure({
        appenders: {
          con: {
            type: 'console',
            layout: {
              json: {}
            }
          },
          conWithOptions: {
            type: 'console',
            layout: {
              json: {
                time_key: 'time',
                message_key: 'message',
                level_key: 'level',
                logger_key: 'logger',
                line_key: 'line',
                error_key: 'error',
                stack_key: 'stack',
                pid_key: 'pid',
                eol: true
              }
            }
          }
        },
        loggers: {
          category1_2: {
            appenders: ['con']
          },
          category1_3: {
            appenders: ['conWithOptions']
          }
        }
      });
      var logger = loggers.get('category1_2');
      logger.info('test test test');
      logger.error('test test test', new Error("YOYO"));
      logger.error(new Error("YOYO"));
      logger.warn('test test test');
      logger.debug('test test test', { test: 'value' });
      logger.fatal('test test test');

      var logger = loggers.get('category1_3');
      logger.info('test test test');
      logger.error('test test test', new Error("YOYO"));
      logger.error(new Error("YOYO"));
      logger.warn('test test test');
      logger.debug('test test test', { test: 'value' });
      logger.fatal('test test test');
      done();
    });
  });
});

describe('RotateFileAppender', function() {
  describe('#logging', function() {
    it('should log to file', function(done) {
      loggers.configure({
        appenders: {
          con: {
            type: 'console',
          },
          file: {
            type: 'rotate_file',
            filePattern: 'rotate-%yyyy-%MM-%dd.log',
            directory: '.',
            layout: {
              pattern: '%yyyy-%MM-%dd%T%HH:%mm:%ss %level %logger %msg %args (%line)%nstack%n'
            }
          }
        },
        loggers: {
          category2: {
            appenders: ['con','file']
          }
        }
      });
      var logger = loggers.get('category2');
      logger.info('test test test info');
      logger.debug('debug test debug');
      logger.error('tes test test', new Error("TESTDAYO"));
      done();
    });
  });
});

