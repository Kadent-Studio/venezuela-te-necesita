import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { ServiceResult } from "./lib";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

type UploadTokenResult = Awaited<ReturnType<typeof handleUpload>>;

type UploadResult = ServiceResult<UploadTokenResult>;

export async function generateUploadToken(
  body: HandleUploadBody,
  rawRequest: Request,
): Promise<UploadResult> {
  try {
    const result = await handleUpload({
      body,
      request: rawRequest,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/heic",
        ],
        maximumSizeInBytes: MAX_BYTES,
        addRandomSuffix: true,
      }),
    });
    return { ok: true, data: result };
  } catch (error) {
    return {
      ok: false,
      error: (error as Error).message,
      status: 400,
    };
  }
}
