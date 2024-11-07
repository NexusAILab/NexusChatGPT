import React, { useEffect, useRef } from 'react';

const Recaptcha = () => {
  const turnstileRef = useRef(null);

  const onTurnstileSuccess = (token) => {
    // Handle the success callback with the received token
    console.log('Turnstile success:', token);
    // You can send the token to your server for verification here
  };

  useEffect(() => {
    // Define the global callback function
    window.onTurnstileSuccess = onTurnstileSuccess;

    // Load the Turnstile script
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    document.body.appendChild(script);

    // Clean up the script when the component is unmounted
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div
      ref={turnstileRef}
      className="cf-turnstile"
      data-sitekey="0x4AAAAAAAzRsaZd0P9-qFot"
      data-theme="light"
      data-callback="onTurnstileSuccess"
    ></div>
  );
};

export default Recaptcha;
