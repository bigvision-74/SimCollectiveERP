import React, { useEffect, useState } from "react";
import { allNotificationAction } from "@/actions/adminActions";

type Notification = {
  id: number;
  notify_by_name?: string;
  photo?: string;
  created_at?: string;
  message?: string;
  title?: string;
  notification_created_at?: string;
  notify_to_name?: string;
  notify_by_photo?: string;
};

const NotificationPage = () => {
  const useremail = localStorage.getItem("user");
  const userrole = localStorage.getItem("role");

  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        if (useremail) {
          const data = await allNotificationAction(useremail);
          setNotifications(data);
        }
      } catch (error) {
        console.error("Failed to load notifications:", error);
      }
    };

    fetchNotifications();
  }, [useremail]);

  return (
    <div className="p-5">
      <h2 className="text-lg font-bold mb-5">All Notifications</h2>
      {notifications.length === 0 ? (
        <div className="text-slate-500">No notifications found.</div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification, index) => (
            <div
              key={notification.id || index}
              className="flex items-start p-4 bg-white dark:bg-darkmode-600 shadow rounded-lg"
            >
              <div className="flex-none w-10 h-10 rounded-full overflow-hidden mr-3">
                <img
                  src={
                    notification.notify_by_photo || "/images/default-avatar.png"
                  }
                  alt="User"
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <div className="font-medium text-base">
                    {notification.notify_by_name || "Unknown User"}
                  </div>
                  <div className="text-xs text-slate-400">
                    {notification.notification_created_at
                      ? new Date(
                          notification.notification_created_at
                        ).toLocaleString()
                      : ""}
                  </div>
                </div>
                <div className="text-slate-600 mt-1">
                  {notification.message || notification.title || "No message"}
                  {userrole === "Superadmin" && notification.notify_to_name && (
                    <span className="block text-xs text-slate-400 mt-1">
                      Sent to: {notification.notify_to_name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationPage;
