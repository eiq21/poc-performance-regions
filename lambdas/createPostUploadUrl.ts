import { APIGatewayProxyHandler } from "aws-lambda";
import * as AWS from "aws-sdk";
import "source-map-support/register";
import { getUploadParameters } from "../core/common";

const s3 = new AWS.S3();

const BUCKET_NAME = process.env.Bucket;
/**
 * Given a set of tags, produces the required XML tagging format as string
 */
export const buildXMLTagSet = (tagset: Record<string, string>): string => {
  const tags = Object.entries(tagset).reduce(
    (acc, [key, value]) =>
      `${acc}<Tag><Key>${key}</Key><Value>${value}</Value></Tag>`,
    ""
  );

  return `<Tagging><TagSet>${tags}</TagSet></Tagging>`;
};

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // expects body to be a JSON containing the required parameters
    const body = JSON.parse(event.body || "");
    const { filename, tags } = getUploadParameters(body);

    const result = s3.createPresignedPost({
      Bucket: BUCKET_NAME,
      Expires: 240, // expiration in seconds
      // matches any value for tagging
      Conditions: tags && [["starts-with", "$tagging", ""]],
      Fields: {
        key: filename,
      },
    });

    return {
      statusCode: 201,
      body: JSON.stringify({
        url: result.url,
        fields: {
          ...result.fields,
          // augment post object with the tagging values
          tagging: tags ? buildXMLTagSet(tags) : undefined,
        },
      }),
    };
  } catch (error) {
    return {
      statusCode: 409,
      body: JSON.stringify({ description: "something went wrong" }),
    };
  }
};
