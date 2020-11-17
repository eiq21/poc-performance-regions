import type { Serverless } from "serverless/aws";

const serverlessConfiguration: Serverless = {
  service: {
    name: "poc-performance-regions",
  },
  frameworkVersion: "2",
  custom: {
    webpack: {
      webpackConfig: "./webpack.config.js",
      includeModules: true,
    },
    bucket: "${self:service.name}-${self:provider.region}-bucket-images",
  },
  // Add the serverless-webpack plugin
  plugins: ["serverless-webpack", "serverless-offline"],
  provider: {
    name: "aws",
    region: "us-east-1",
    runtime: "nodejs12.x",
    apiGateway: {
      minimumCompressionSize: 1024,
      binaryMediaTypes: ["multipart/form-data"],
    },

    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
    },
    iamRoleStatements: [
      {
        Effect: "Allow",
        Action: [
          "s3:PutObject",
          "s3:GetObject",
          "s3:PutObjectTagging",
          "s3:GetBucketPolicy",
          "s3:PutBucketPolicy",
        ],
        Resource: ["arn:aws:s3:::${self:custom.bucket}/*"],
      },
    ],
    tracing: {
      lambda: true,
      apiGateway: true,
    },
  },
  functions: {
    uploadImgDirectly: {
      handler: "lambdas/uploadImgDirectly.handler",
      memorySize: 1024, //optional, in MB, default is 1024
      timeout: 900, //# optional, in seconds, default is 6
      events: [
        {
          http: {
            method: "post",
            path: "upload",
            cors: true,
          },
        },
      ],
      environment: { Bucket: "${self:custom.bucket}" },
    },
    createPostUploadUrl: {
      handler: "lambdas/createPostUploadUrl.handler",
      memorySize: 1024, //optional, in MB, default is 1024
      timeout: 900, //# optional, in seconds, default is 6
      events: [
        {
          http: {
            method: "post",
            path: "create-upload-url",
            cors: true,
          },
        },
      ],
      environment: { Bucket: "${self:custom.bucket}" },
    },

    uploadFile: {
      handler: "lambdas/uploadFile.handler",
      memorySize: 1024, //optional, in MB, default is 1024
      timeout: 900, //# optional, in seconds, default is 6
      events: [
        {
          http: {
            method: "post",
            path: "upload",
            cors: true,
          },
        },
      ],
      environment: { Bucket: "${self:custom.bucket}" },
    },
  },
  resources: {
    Resources: {
      StorageBucket: {
        Type: "AWS::S3::Bucket",
        Properties: {
          BucketName: "${self:custom.bucket}",
        },
      },
    },
  },
};

module.exports = serverlessConfiguration;
