import Busboy from "busboy";

export interface UploadedFile {
  filename: string;
  contentType: string;
  encoding: string;
  fieldname: string;
  content: Buffer | string;
}

export interface FormData {
  file?: UploadedFile;
  fields: Record<string, any>;
}

class FormParser {
  private getContentType = (event: any) => {
    let contentType = event.headers["content-type"];
    if (!contentType) {
      return event.headers["Content-Type"];
    }
    console.log(contentType);
    return contentType;
  };

  public parser = (event: any, fileZise: number): Promise<FormData> => {
    return new Promise((resolve, reject) => {
      try {
        const fields: Record<string, any> = {};
        let uploadedFile: UploadedFile;

        const busboy = new Busboy({
          headers: {
            "content-type": this.getContentType(event),
          },
          limits: {
            fileSize: fileZise,
          },
        });

        busboy.on(
          "file",
          (
            fieldname: any,
            file: any,
            filename: any,
            encoding: any,
            mimetype: any
          ) => {
            file.on("data", (data: any) => {
              uploadedFile.content = data;
            });
            file.on("end", () => {
              if (uploadedFile.content) {
                uploadedFile.filename = filename;
                uploadedFile.contentType = mimetype;
                uploadedFile.encoding = encoding;
                uploadedFile.fieldname = fieldname;
                // result.files.push(uploadedFile);
              }
            });
          }
        );

        busboy.on("field", (fieldname, value) => {
          fields[fieldname] = value;
        });

        busboy.on("error", (error: any) => reject(`Parse error: ${error}`));
        busboy.on("finish", () => resolve({ file: uploadedFile, fields }));

        busboy.write(event.body, event.isBase64Encoded ? "base64" : "binary");
        busboy.end();
      } catch (error) {
        reject(error);
      }
    });
  };
}

export { FormParser };
