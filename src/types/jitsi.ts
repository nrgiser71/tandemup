// Jitsi Meet External API types

export interface JitsiMeetConfig {
  roomName: string;
  width?: string | number;
  height?: string | number;
  configOverwrite?: {
    disableDeepLinking?: boolean;
    disableProfile?: boolean;
    disableInviteFunctions?: boolean;
    hideConferenceSubject?: boolean;
    hideConferenceTimer?: boolean;
    prejoinPageEnabled?: boolean;
    enableWelcomePage?: boolean;
    startWithAudioMuted?: boolean;
    startWithVideoMuted?: boolean;
    toolbarButtons?: string[];
    [key: string]: any;
  };
  interfaceConfigOverwrite?: {
    SHOW_JITSI_WATERMARK?: boolean;
    SHOW_WATERMARK_FOR_GUESTS?: boolean;
    DEFAULT_REMOTE_DISPLAY_NAME?: string;
    TOOLBAR_ALWAYS_VISIBLE?: boolean;
    [key: string]: any;
  };
  onload?: () => void;
  invitees?: Array<{ id: string; name: string; avatar?: string }>;
  devices?: {
    audioInput?: string;
    audioOutput?: string;
    videoInput?: string;
  };
  userInfo?: {
    displayName?: string;
    email?: string;
    avatarURL?: string;
  };
}

export interface JitsiMeetEvents {
  'videoConferenceJoined': (data: { roomName: string; id: string; displayName: string }) => void;
  'videoConferenceLeft': (data: { roomName: string }) => void;
  'participantJoined': (data: { id: string; displayName: string }) => void;
  'participantLeft': (data: { id: string; kicked?: boolean }) => void;
  'audioMuteStatusChanged': (data: { muted: boolean }) => void;
  'videoMuteStatusChanged': (data: { muted: boolean }) => void;
  'screenSharingStatusChanged': (data: { on: boolean; details?: any }) => void;
  'dominantSpeakerChanged': (data: { id: string }) => void;
  'raiseHandUpdated': (data: { id: string; handRaised: boolean }) => void;
  'tileViewChanged': (data: { enabled: boolean }) => void;
  'chatUpdated': (data: { isOpen: boolean; unreadCount?: number }) => void;
  'incomingMessage': (data: { from: string; nick: string; message: string; privateMessage?: boolean; timestamp: string }) => void;
  'outgoingMessage': (data: { message: string }) => void;
  'displayNameChange': (data: { id: string; displayName: string }) => void;
  'deviceListChanged': (data: { devices: any }) => void;
  'emailChange': (data: { id: string; email: string }) => void;
  'feedbackSubmitted': (data: { error?: string }) => void;
  'filmstripDisplayChanged': (data: { visible: boolean }) => void;
  'toolbarButtonClicked': (data: { key: string }) => void;
  'subtitlesReceived': (data: { id: string; name: string; transcript: string; messageID: string; language: string }) => void;
  'endpointTextMessageReceived': (data: { senderInfo: { jid: string; nick: string }; eventData: { name: string; text: string } }) => void;
  'knockingParticipant': (data: { id: string; name: string }) => void;
  'mouseEnter': (data: { roomName: string }) => void;
  'mouseLeave': (data: { roomName: string }) => void;
  'passwordRequired': () => void;
  'readyToClose': () => void;
  'recordingLinkAvailable': (data: { link: string; ttl: number }) => void;
  'recordingStatusChanged': (data: { on: boolean; mode: string; error?: string }) => void;
  'subjectChange': (data: { subject: string }) => void;
  'suspendDetected': () => void;
}

export interface JitsiMeetAPI {
  addEventListener: <K extends keyof JitsiMeetEvents>(event: K, listener: JitsiMeetEvents[K]) => void;
  removeEventListener: <K extends keyof JitsiMeetEvents>(event: K, listener: JitsiMeetEvents[K]) => void;
  executeCommand: (command: string, ...args: any[]) => void;
  executeCommands: (commands: { [command: string]: any }) => void;
  getAvailableDevices: () => Promise<{ audioInput: any[]; audioOutput: any[]; videoInput: any[] }>;
  getCurrentDevices: () => Promise<{ audioInput: any; audioOutput: any; videoInput: any }>;
  isDeviceChangeAvailable: (deviceType: string) => boolean;
  isDeviceListAvailable: () => boolean;
  isMultipleAudioInputSupported: () => boolean;
  setAudioInputDevice: (deviceId: string, deviceLabel?: string) => void;
  setAudioOutputDevice: (deviceId: string, deviceLabel?: string) => void;
  setVideoInputDevice: (deviceId: string, deviceLabel?: string) => void;
  getParticipantsInfo: () => Array<{ participantId: string; displayName: string; avatarURL?: string; role?: string; email?: string }>;
  getVideoQuality: () => number;
  isAudioMuted: () => Promise<boolean>;
  isVideoMuted: () => Promise<boolean>;
  isAudioAvailable: () => Promise<boolean>;
  isVideoAvailable: () => Promise<boolean>;
  captureLargeVideoScreenshot: () => Promise<string>;
  getDeploymentInfo: () => Promise<{ region?: string; shard?: string; releaseNumber?: string; server?: string; serverRegion?: string }>;
  dispose: () => void;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: new (domain: string, options: JitsiMeetConfig) => JitsiMeetAPI;
  }
}