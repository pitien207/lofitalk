import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { VideoOffIcon } from "lucide-react";

const CallPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    const timer = setTimeout(() => navigate("/chats"), 2000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="rounded-3xl border border-base-300 bg-base-100/90 px-6 py-8 shadow">
        <div className="flex items-center justify-center gap-3">
          <VideoOffIcon className="size-8 text-error" />
          <h1 className="text-2xl font-semibold">Video calls are temporarily unavailable</h1>
        </div>
        <p className="mt-3 text-base-content/70">
          We&apos;re migrating away from Stream and calls for room <span className="font-mono">{id}</span> are paused.
          You can keep chatting while we finish this update.
        </p>
        <button type="button" className="btn btn-primary mt-6 text-white" onClick={() => navigate("/chats")}>
          Back to chats
        </button>
      </div>
    </div>
  );
};

export default CallPage;
