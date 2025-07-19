import axios from "axios";
import env from "../../env";
import { getFreshIdToken } from "./authAction";

export const sendNotificationToFacultiesAction = async (
  faculties: any[], // should be array of users with fcm_token
  userId: number,
  testsPayload: any[] // selectedTests payload
): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/sendNotificationToFaculties`,
      {
        facultiesIds: faculties,
        userId: userId,
        payload: testsPayload,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
};

