import React from "react";
import { useUploads } from "../UploadContext";
import { X } from "lucide-react";

const UploadNotifications: React.FC = () => {
  const { tasks, updateTask } = useUploads();

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024)
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  if (tasks.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-h-[80vh] overflow-y-auto rounded-xl p-4">
      {tasks.map((task) => (
        <div
          key={task.id}
          className={`rounded-lg p-4 mb-3 border transition-all duration-300 ${
            task.status === "failed"
              ? "border-red-200 bg-red-50 dark:bg-red-900/30"
              : task.status === "completed"
              ? "border-green-200 bg-green-50 dark:bg-green-900/30"
              : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
          }`}
        >
          <div className="flex justify-between items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate flex-1 min-w-0">
                {task.contentName}
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-sm font-medium truncate flex-1 min-w-0">
                  {task.fileName}
                </p>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    task.status === "failed"
                      ? "bg-red-500 text-white"
                      : task.status === "completed"
                      ? "bg-green-500 text-white"
                      : "bg-primary text-white"
                  }`}
                >
                  {task.status === "failed"
                    ? "Failed"
                    : task.status === "completed"
                    ? "Completed"
                    : task.status === "uploading"
                    ? `${task.progress}%`
                    : "Pending"}
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                <span>{task.status === "uploading" ? "Uploading..." : ""}</span>
                <span>
                  {formatFileSize((task.fileSize * task.progress) / 100)} /{" "}
                  {formatFileSize(task.fileSize)}
                </span>
              </div>
            </div>
          </div>

          {(task.status === "uploading" || task.status === "completed") && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  task.status === "completed" ? "bg-green-500" : "bg-primary"
                }`}
                style={{ width: `${task.progress}%` }}
              ></div>
            </div>
          )}

          {task.error && (
            <p className="text-sm text-red-500 dark:text-red-400 mt-2 truncate">
              {task.error}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

export default UploadNotifications;
