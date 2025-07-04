import AgoraRTC from "agora-rtc-sdk-ng";

// Create Agora client
export const createAgoraClient = () => {
  return AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
};

// Create screen share track
export const createScreenTrack = async () => {
  const screenTrack = await AgoraRTC.createScreenVideoTrack({
    encoderConfig: "1080p"
    });
  return screenTrack;
};
