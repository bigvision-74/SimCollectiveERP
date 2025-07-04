import axios, { AxiosProgressEvent } from "axios";
import env from "../env";
import { getFreshIdToken } from "./authAction";

export const getPresignedApkUrlAction = async (
  fileName: string,
  fileType: string,
  fileSize: number
): Promise<any> => {
  try {
    const token = await getFreshIdToken();

    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/generate-presigned-url`,
      {
        params: {
          name: fileName,
          type: fileType,
          size: fileSize,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching presigned URL:", error);
    throw error;
  }
};

export const uploadFileAction = async (
  presignedUrl: string,
  file: File,
  taskId: string,
  updateTask: (id: string, updates: Partial<any>) => void,
  options: { onProgress?: (percent: number) => void; timeout?: number } = {}
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    if (!presignedUrl.startsWith("https://")) {
      updateTask(taskId, { status: "failed", error: "Invalid presigned URL" });
      return { success: false, error: "Invalid presigned URL" };
    }

    const source = axios.CancelToken.source();
    const timeout = setTimeout(() => {
      source.cancel("Upload timeout");
      updateTask(taskId, { status: "failed", error: "Upload timeout" });
    }, options.timeout || 600000);

    updateTask(taskId, { status: "uploading", progress: 0 });

    const response = await axios.put(presignedUrl, file, {
      headers: {
        "Content-Type": file.type,
        "Content-Length": file.size.toString(),
      },
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        try {
          const percent = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || file.size)
          );
          updateTask(taskId, { progress: percent });
          options.onProgress?.(percent);
        } catch (err) {
          console.error("Progress callback error:", err);
        }
      },
      cancelToken: source.token,
    });

    clearTimeout(timeout);
    updateTask(taskId, { status: "completed", progress: 100 });
    return { success: true, url: presignedUrl.split("?")[0] };
  } catch (error) {
    let errorMessage = "Upload failed";

    if (axios.isAxiosError(error)) {
      console.error("Axios error details:", {
        message: error.message,
        code: error.code,
        response: error.response
          ? {
              status: error.response.status,
              data: error.response.data,
              headers: error.response.headers,
            }
          : "No response",
      });

      if (error.code === "ECONNABORTED") {
        errorMessage = "Upload timeout";
      } else if (error.response) {
        errorMessage = `Server error: ${error.response.status} - ${
          error.response.data?.message || "No details"
        }`;
      } else {
        errorMessage = error.message || "Network error";
      }
    } else {
      console.error("Non-Axios error:", error);
    }

    console.error("Upload error:", errorMessage);
    // Update task to failed status with error
    updateTask(taskId, { status: "failed", error: errorMessage });
    return { success: false, error: errorMessage };
  }
};

export const getPackageNameAction = async (formData: FormData): Promise<{ packageName: string }> => {
  try {
    const token = await getFreshIdToken();

    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/extract-apk-package`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error extracting APK:", error);
    throw error;
  }
};
