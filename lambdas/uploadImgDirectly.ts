import { APIGatewayProxyHandler } from "aws-lambda";
import * as AWS from "aws-sdk";
import * as uuid from "uuid";
import { FormParser } from "../core/utils/formParser";
// import Jimp from "Jimp";
import "source-map-support/register";

const s3 = new AWS.S3();
const formParser = new FormParser();

const bucketName = process.env.Bucket;
const MAX_SIZE = 10000000; // 20MB
const PNG_MIME_TYPE = "image/png";
const JPEG_MIME_TYPE = "image/jpeg";
const JPG_MIME_TYPE = "image/jpg";
const MIME_TYPES = [PNG_MIME_TYPE, JPEG_MIME_TYPE, JPG_MIME_TYPE];

export const handler: APIGatewayProxyHandler = async (event, _context) => {
  try {
    const formData: any = await formParser.parser(event, MAX_SIZE);
    const file = formData.files[0];
    if (!isAllowedFile(file.content.byteLength, file.contentType))
      getErrorMessage("File size or type not allowed");

    const uid = uuid.v4();
    const originalKey = `${uid}_original_${file.filename}`;
    // const thumbnailKey = `${uid}_thumbnail_${file.filename}`;

    // const fileResizedBuffer = await resize(file.content, file.contentType, 460);
    const originalFile = await uploadToS3(
      bucketName,
      originalKey,
      file.content,
      file.contentType
    );
    // const [originalFile, thumbnailFile] = await Promise.all([
    //   uploadToS3(bucketName, originalKey, file.content, file.contentType),
    //   uploadToS3(bucketName, thumbnailKey, fileResizedBuffer, file.contentType),
    // ]);

    const signedOriginalUrl = await s3.getSignedUrlPromise("getObject", {
      Bucket: originalFile.Bucket,
      Key: originalKey,
      Expires: 60000,
    });
    // const signedThumbnailUrl = await s3.getSignedUrlPromise("getObject", {
    //   Bucket: thumbnailFile.Bucket,
    //   Key: thumbnailKey,
    //   Expires: 60000,
    // });

    return {
      statusCode: 200,
      body: JSON.stringify({
        id: uid,
        mimeType: file.contentType,
        originalKey: originalFile.key,
        // thumbnailKey: thumbnailFile.key,
        bucket: originalFile.Bucket,
        fileName: file.filename,
        originalUrl: signedOriginalUrl,
        // thumbnailUrl: signedThumbnailUrl,
        originalSize: file.content.byteLength,
      }),
    };
  } catch (error) {
    return getErrorMessage(error.message);
  }
};

const getErrorMessage = (message: string) => ({
  statusCode: 500,
  body: JSON.stringify(message),
});

const isAllowedFile = (size: number, mimeType: string): boolean => {
  if (size > MAX_SIZE) return false;
  if (MIME_TYPES.indexOf(mimeType) === -1) return false;

  return true;
};

const uploadToS3 = (
  bucket: string,
  key: string,
  buffer: any,
  mimeType: string
): Promise<any> =>
  new Promise((resolve, reject) => {
    const params = {
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    };
    const options = { partSize: 10 * 1024 * 1024, queueSize: 1 };
    s3.upload(params, options, (err: any, data: any) => {
      if (err) reject(err);
      resolve(data);
    });
  });

// const resize = (buffer: any, mimeType: string, width: any): Promise<any> =>
//   new Promise((resolve, reject) => {
//     Jimp.read(buffer)
//       .then((image) =>
//         image.resize(width, Jimp.AUTO).quality(70).getBufferAsync(mimeType)
//       )
//       .then((resizedBuffer) => resolve(resizedBuffer))
//       .catch((error) => reject(error));
//   });
