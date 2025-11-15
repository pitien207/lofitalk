import { VideoIcon } from "lucide-react";

function CallButton({ handleVideoCall }) {
  return (
    <button onClick={handleVideoCall} className="btn btn-brand btn-sm text-white">
      <VideoIcon className="size-6" />
    </button>
  );
}

export default CallButton;
