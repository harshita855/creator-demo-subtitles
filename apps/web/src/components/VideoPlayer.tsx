"use client";

import { forwardRef } from "react";

interface VideoPlayerProps {
  src: string;
}

// forwardRef so the parent editor page can call videoRef.current.seek(time)
// when a segment row is clicked.
export const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  ({ src }, ref) => {
    return (
      <video
        ref={ref}
        src={src}
        controls
        className="w-full rounded-lg bg-black"
      />
    );
  }
);

VideoPlayer.displayName = "VideoPlayer";
