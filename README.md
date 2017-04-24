Subscribe to DynamoDB streams easily.

## Installation

```javascript
npm i dynamodb-subscriber --save
```

## Usage

`DynamoDBSubscriber` allows you to watch the events happening since you start to watch. In the AWS stream API this is `ShardIteratorType: 'LATEST'`.

```javascript
const DynamoDBSubscriber = require('dynamodb-subscriber');

const subscriber = new DynamoDBSubscriber({
  arn: 'arn:aws:dynamodb:us-west-1:XXXX:table/YYYY/stream/ZZZZ',
  interval: '1s',
});

subscriber.on('record', (record, keys) => {
  console.log('entire record:')
  console.dir(record)
  console.log('key:')
  console.dir(keys)
});

subscriber.start();
```

Example output:

```javascript
entire record:
{ eventID: 'xxxxx',
  eventName: 'INSERT',
  eventVersion: '1.1',
  eventSource: 'aws:dynamodb',
  awsRegion: 'us-west-1',
  dynamodb:
   { ApproximateCreationDateTime: Fri Aug 05 2016 16:43:00 GMT-0300 (ART),
     Keys: { name: { S: 'YYYYZZZ' } },
     SequenceNumber: '4324698400043243243243246',
     SizeBytes: 35,
     StreamViewType: 'KEYS_ONLY' } }

key:
{ name: 'YYYYZZZ'
}
```

You can also initialize with the name of the table like this:

```javascript
const subscriber = new DynamoDBSubscriber({
  table: 'my-dynamodb-table',
  interval: '1s',
});
```

The constructor parameters are:

- `arn`: the ARN of the resource. Copy this from the AWS console.
- `interval` (optional): it can be either a number of milliseconds or an string indicating an interval to poll ([syntax from ms](https://www.npmjs.com/package/ms)).

Events:

- `record`: emitted when a new record is pull from the stream.
- `error`: when the AWS API return an error.

Methods:
- `start`: start to poll the shards periodically.
- `stop`: stop watching the stream.

## Stream interface

In addition to the EventEmitter there is a way to create a readable stream with this module.

```javascript
const DynamoDBStream = require('dynamodb-subscriber').Stream;

const dynamoDbStream = new DynamoDBStream({
  arn: 'arn:aws:dynamodb:us-west-1:XXXX:table/YYYY/stream/ZZZZ',
  interval: '1s',
});

dynamoDbStream.pipe(stringify).pipe(process.stdout);
```

## IAM

In order to use this module you need the following permissions on the stream resource:

-  dynamodb:DescribeStream
-  dynamodb:GetShardIterator
-  dynamodb:GetRecords

Additionally, if you initialize with table name instead of arn, we need either of these two:

-  dynamodb:ListStreams on the stream arn
-  dynamodb:DescribeTable on the table itself

## License

MIT 2016 - José F. Romaniello. See the License file on this repository.
