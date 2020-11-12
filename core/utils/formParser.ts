import Busboy from "busboy";

class FormParser {
  private getContentType = (event: any) => {
    let contentType = event.headers["content-type"];
    if (!contentType) {
      return event.headers["Content-Type"];
    }
    console.log(contentType);
    return contentType;
  };

  public parser = (event: any, fileZise: number): Promise<any> => {
    return new Promise((resolve, reject) => {
      try {
        const busboy = new Busboy({
          headers: {
            "content-type": this.getContentType(event),
          },
          limits: {
            fileSize: fileZise,
          },
        });
        let result: any = {
          files: [],
        };

        busboy.on(
          "file",
          (
            fieldname: any,
            file: any,
            filename: any,
            encoding: any,
            mimetype: any
          ) => {
            let uploadFile: any = {};
            file.on("data", (data: any) => {
              uploadFile.content = data;
            });
            file.on("end", () => {
              if (uploadFile.content) {
                uploadFile.filename = filename;
                uploadFile.contentType = mimetype;
                uploadFile.encoding = encoding;
                uploadFile.fieldname = fieldname;
                result.files.push(uploadFile);
              }
            });
          }
        );

        busboy.on("field", (fieldname, value) => {
          result[fieldname] = value;
        });

        busboy.on("error", (error: any) => reject(`Parse error: ${error}`));
        busboy.on("finish", () => resolve(result));

        busboy.write(event.body, event.isBase64Encoded ? "base64" : "binary");
        busboy.end();
      } catch (error) {
        reject(error);
      }
    });
  };
}

export { FormParser };
