import React, { useState, useEffect, useRef } from 'react';
import useStore from '@store/store';

import ChatContent from './ChatContent';
import MobileBar from '../MobileBar';
import StopGeneratingButton from '@components/StopGeneratingButton/StopGeneratingButton';

// Extend the Window interface to include the Turnstile properties
declare global {
  interface Window {
    onTurnstileSuccess: (token: string) => void;
    turnstile: any;
  }
}

const Chat = () => {
  const hideSideMenu = useStore((state) => state.hideSideMenu);
  const [isTurnstileSuccess, setIsTurnstileSuccess] = useState(false);
  const turnstileRef = useRef<HTMLDivElement>(null); // Correctly type the ref

  useEffect(() => {
    // Define the callback function for Turnstile success
    window.onTurnstileSuccess = function (token: string) {
      // Turnstile challenge passed successfully
      setIsTurnstileSuccess(true);
      // You can send the token to your server for verification if needed
      console.log('Turnstile token:', token);
    };

    // Function to render the Turnstile widget
    const renderTurnstile = () => {
      if (window.turnstile && turnstileRef.current) {
        window.turnstile.render(turnstileRef.current, {
          sitekey: '0x4AAAAAAAzRsaZd0P9-qFot',
          theme: 'light',
          callback: 'onTurnstileSuccess',
        });
      } else {
        // If turnstile is not available yet, try again after some time
        setTimeout(renderTurnstile, 500);
      }
    };

    // Start rendering the Turnstile widget
    renderTurnstile();

    return () => {
      // Clean up the callback function when the component unmounts
      delete window.onTurnstileSuccess;
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
        {!isTurnstileSuccess && (
          <div
            ref={turnstileRef}
            className="cf-turnstile"
            data-sitekey="0x4AAAAAAAzRsaZd0P9-qFot"
            data-theme="light"
            data-callback="onTurnstileSuccess"
          ></div>
        )}
        {isTurnstileSuccess && (
          <>
            <ChatContent />
            <StopGeneratingButton />
          </>
        )}
      </main>
    </div>
  );
};

export default Chat;
