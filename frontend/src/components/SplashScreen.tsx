import React, { useEffect, useState } from 'react';

type SplashScreenProps = {
  onComplete: () => void;
};

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Play animation for 4 seconds, then hide
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-teal-50 to-cyan-50 z-50 overflow-hidden flex items-center justify-center">
      {/* Decorative animated elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse"></div>
      <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
      
      {/* Animation Video - Centered */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <video
          autoPlay
          muted
          playsInline
          className="w-96 h-96 object-contain drop-shadow-2xl"
        >
          <source
            src="https://res.cloudinary.com/dyobufbnk/video/upload/v1769773731/sujaanimation_fow4jq.mp4"
            type="video/mp4"
          />
          Your browser does not support the video tag.
        </video>
        <p className="text-gray-600 text-lg font-semibold mt-8 animate-pulse">
          Loading Suja Chick Delivery...
        </p>
      </div>
    </div>
  );
}
