import React from 'react';

interface SplashScreenProps {
  onComplete?: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <video
        autoPlay
        muted
        playsInline
        onEnded={onComplete}
        className="w-full h-full object-contain"
      >
        <source src="https://res.cloudinary.com/dyobufbnk/video/upload/v1770714755/IMG_2466_3_1_eq0e5b.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
