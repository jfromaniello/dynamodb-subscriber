const AWS = require('aws-sdk-mock');
const assert = require('chai').assert;
const DynamoDBSubscriber = require('../index');

describe('DynamodbSubscriber', function () {
  afterEach(function () {
    AWS.restore();
  });

  describe('subscribing to stream with 1 record', function() {
    const arn = 'urn:test:test';
    const ShardId = '456';
    const ShardIterator = 'iterator-123';

    before(function() {
      AWS.mock('DynamoDBStreams', 'describeStream', (params, callback) => {
        if (params.StreamArn !== arn) {
          return callback(new Error(`unknown stream ${params.StreamArn}`));
        }
        if (params.ExclusiveStartShardId !== undefined) {
          return callback(new Error(`unexpected ${params.ExclusiveStartShardId}`));
        }
        callback(null, {
          StreamDescription: {
            Shards: [
              { ShardId: '123', SequenceNumberRange: { EndingSequenceNumber: '1234' } },
              { ShardId: '456', SequenceNumberRange: { } }
            ]
          }
        });
      });

      AWS.mock('DynamoDBStreams', 'getShardIterator', (params, callback) => {
        if (params.ShardId !== ShardId) {
          return callback(new Error(`unknown ShardId ${params.ShardId}`));
        }
        callback(null, { ShardIterator });
      });

      const record = {
        dynamodb: {
          ApproximateCreationDateTime: new Date(),
          Keys: {
            foo: { S: 'bar' },
            baz: { S: 'bax' }
          },
          SequenceNumber: '1883831300000000005697243583',
          SizeBytes: 38,
          StreamViewType: 'KEYS_ONLY'
        }
      };

      AWS.mock('DynamoDBStreams', 'getRecords', (params, callback) => {
        if (params.ShardIterator !== ShardIterator) {
          return callback(new Error(`unknown ShardId ${params.ShardId}`));
        }
        callback(null, { Records: [ record ], NextShardIterator: 'iterator-456' });
      });
    });

    it('should return the record', function (done) {
      const subscriber = new DynamoDBSubscriber({ arn: arn, interval: 100 });

      subscriber.once('record', (r, key) => {
        assert.property(r, 'dynamodb');
        assert.deepEqual(key.foo, 'bar');
        assert.deepEqual(key.baz, 'bax');
        subscriber.stop();
        done();
      }).start();
    });
  });


  describe('subscribing to stream by tablename with 1 record', function() {
    const arn = 'urn:test:test';
    const ShardId = '456';
    const ShardIterator = 'iterator-123';
    const TableName = 'credentials';

    before(function() {
      AWS.mock('DynamoDB', 'describeTable', (params, callback) => {
        if (params.TableName !== TableName) {
          return callback(new Error(`unnknown table ${params.table}`));
        }
        return callback(null, {
          Table: {
            LatestStreamArn: arn
          }
        });
      });

      AWS.mock('DynamoDBStreams', 'describeStream', (params, callback) => {
        if (params.StreamArn !== arn) {
          return callback(new Error(`unknown stream ${params.StreamArn}`));
        }
        if (params.ExclusiveStartShardId !== undefined) {
          return callback(new Error(`unexpected ${params.ExclusiveStartShardId}`));
        }
        callback(null, {
          StreamDescription: {
            Shards: [
              { ShardId: '123', SequenceNumberRange: { EndingSequenceNumber: '1234' } },
              { ShardId: '456', SequenceNumberRange: { } }
            ]
          }
        });
      });

      AWS.mock('DynamoDBStreams', 'getShardIterator', (params, callback) => {
        if (params.ShardId !== ShardId) {
          return callback(new Error(`unknown ShardId ${params.ShardId}`));
        }
        callback(null, { ShardIterator });
      });

      const record = {
        dynamodb: {
          ApproximateCreationDateTime: new Date(),
          Keys: {
            foo: { S: 'bar' },
            baz: { S: 'bax' }
          },
          SequenceNumber: '1883831300000000005697243583',
          SizeBytes: 38,
          StreamViewType: 'KEYS_ONLY'
        }
      };

      AWS.mock('DynamoDBStreams', 'getRecords', (params, callback) => {
        if (params.ShardIterator !== ShardIterator) {
          return callback(new Error(`unknown ShardId ${params.ShardId}`));
        }
        callback(null, { Records: [ record ], NextShardIterator: 'iterator-456' });
      });
    });

    it('should return the record', function (done) {
      const subscriber = new DynamoDBSubscriber({ table: TableName, interval: 100 });

      subscriber.once('record', (r, key) => {
        assert.property(r, 'dynamodb');
        assert.deepEqual(key.foo, 'bar');
        assert.deepEqual(key.baz, 'bax');
        subscriber.stop();
        done();
      }).start();
    });
  });


});
