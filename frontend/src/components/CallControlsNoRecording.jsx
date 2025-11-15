import { OwnCapability } from "@stream-io/video-client";
import { Restricted } from "@stream-io/video-react-bindings";
import {
  SpeakingWhileMutedNotification,
  ReactionsButton,
  ScreenShareButton,
  ToggleAudioPublishingButton,
  ToggleVideoPublishingButton,
  CancelCallButton,
} from "@stream-io/video-react-sdk";

const CallControlsNoRecording = ({ onLeave }) => (
  <div className="str-video__call-controls">
    <Restricted requiredGrants={[OwnCapability.SEND_AUDIO]}>
      <SpeakingWhileMutedNotification>
        <ToggleAudioPublishingButton />
      </SpeakingWhileMutedNotification>
    </Restricted>
    <Restricted requiredGrants={[OwnCapability.SEND_VIDEO]}>
      <ToggleVideoPublishingButton />
    </Restricted>
    <Restricted requiredGrants={[OwnCapability.CREATE_REACTION]}>
      <ReactionsButton />
    </Restricted>
    <Restricted requiredGrants={[OwnCapability.SCREENSHARE]}>
      <ScreenShareButton />
    </Restricted>
    <CancelCallButton onLeave={onLeave} />
  </div>
);

export default CallControlsNoRecording;
