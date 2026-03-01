const { EC2Client } = require("@aws-sdk/client-ec2");
const { S3Client } = require("@aws-sdk/client-s3");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { IAMClient } = require("@aws-sdk/client-iam");

const ENDPOINT = process.env.LOCALSTACK_ENDPOINT || "http://localstack:4566";
const REGION = process.env.AWS_DEFAULT_REGION || "us-east-1";

const commonConfig = {
  endpoint: ENDPOINT,
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "test",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "test",
  },
  forcePathStyle: true,
};

const ec2 = new EC2Client(commonConfig);
const s3 = new S3Client(commonConfig);
const dynamodb = new DynamoDBClient(commonConfig);
const iam = new IAMClient(commonConfig);

module.exports = { ec2, s3, dynamodb, iam };
