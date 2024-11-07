import React, { useEffect, useState } from 'react';
import useStore from '@store/store';

import ChatContent from './ChatContent';
import MobileBar from '../MobileBar';
import StopGeneratingButton from '@components/StopGeneratingButton/StopGeneratingButton';

const Chat = () => {
  const hideSideMenu = useStore((state) => state.hideSideMenu);
  const [turnstileToken, setTurnstileToken] = useState(null);

  useEffect(() => {
    // Load the Cloudflare Turnstile script
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    // Define the callback function
    window.onTurnstileSuccess = function(token) {
      console.log('Turnstile verification success:', token);
      setTurnstileToken(token);
      // You can send this token to your server to verify it
    };

    return () => {
      // Cleanup when the component unmounts
      delete window.onTurnstileSuccess;
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div
      className={`flex h-full flex-1 flex-col ${
        hideSideMenu ? 'md:pl-0' : 'md:pl-[260px]'
      }`}
    >
      <MobileBar />
      <main className="relative h-full w-full transition-width flex flex-col overflow-hidden items-stretch flex-1">
        <div
          className="cf-turnstile"
          data-sitekey="0x4AAAAAAAzRsaZd0P9-qFot"
          data-theme="light"
          data-callback="onTurnstileSuccess"
        ></div>
        {turnstileToken ? (
          <>
            <ChatContent />
            <StopGeneratingButton />
          </>
        ) : (
          <p>Please complete the verification to proceed.</p>
        )}
      </main>
    </div>
  );
};

export default Chat;
