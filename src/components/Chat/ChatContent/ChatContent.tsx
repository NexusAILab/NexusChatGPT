import React, { useEffect, useRef } from 'react';
import ScrollToBottom from 'react-scroll-to-bottom';
import useStore from '@store/store';

import ScrollToBottomButton from './ScrollToBottomButton';
import ChatTitle from './ChatTitle';
import Message from './Message';
import NewMessageButton from './Message/NewMessageButton';
import CrossIcon from '@icon/CrossIcon';

import useSubmit from '@hooks/useSubmit';
import DownloadChat from './DownloadChat';
import CloneChat from './CloneChat';
import ShareGPT from '@components/ShareGPT';
import Turnstile, { useTurnstile } from 'react-turnstile'; // Added import

const ChatContent = () => {
  const inputRole = useStore((state) => state.inputRole);
  const setError = useStore((state) => state.setError);
  const messages = useStore((state) =>
    state.chats &&
    state.chats.length > 0 &&
    state.currentChatIndex >= 0 &&
    state.currentChatIndex < state.chats.length
      ? state.chats[state.currentChatIndex].messages
      : []
  );
  const stickyIndex = useStore((state) =>
    state.chats &&
    state.chats.length > 0 &&
    state.currentChatIndex >= 0 &&
    state.currentChatIndex < state.chats.length
      ? state.chats[state.currentChatIndex].messages.length
      : 0
  );
  const advancedMode = useStore((state) => state.advancedMode);
  const generating = useStore.getState().generating;
  const hideSideMenu = useStore((state) => state.hideSideMenu);

  const saveRef = useRef<HTMLDivElement>(null);
  const { token, reset } = useTurnstile(); // Hook to get the token and reset function

  // clear error at the start of generating new messages
  useEffect(() => {
    if (generating) {
      setError('');
    }
  }, [generating]);

  const { error } = useSubmit();

  // Handle token changes (e.g., save it to state or send it to your server)
  useEffect(() => {
    if (token) {
      console.log('Turnstile token:', token);
      // You can dispatch an action or save the token to your store here
    }
  }, [token]);

  return (
    <div className='flex-1 overflow-hidden'>
      <ScrollToBottom
        className='h-full dark:bg-gray-800'
        followButtonClassName='hidden'
      >
        <ScrollToBottomButton />
        <div className='flex flex-col items-center text-sm dark:bg-gray-800'>
          <div
            className='flex flex-col items-center text-sm dark:bg-gray-800 w-full'
            ref={saveRef}
          >
            {advancedMode && <ChatTitle />}
            {!generating && advancedMode && messages?.length === 0 && (
              <NewMessageButton messageIndex={-1} />
            )}
            {messages?.map(
              (message, index) =>
                (advancedMode ||
                  index !== 0 ||
                  message.role !== 'system') && (
                  <React.Fragment key={index}>
                    <Message
                      role={message.role}
                      content={message.content}
                      messageIndex={index}
                    />
                    {!generating && advancedMode && (
                      <NewMessageButton messageIndex={index} />
                    )}
                  </React.Fragment>
                )
            )}
          </div>

          <Message
            role={inputRole}
            content=''
            messageIndex={stickyIndex}
            sticky
          />
          {error !== '' && (
            <div className='relative py-2 px-3 w-3/5 mt-3 max-md:w-11/12 border rounded-md border-red-500 bg-red-500/10'>
              <div className='text-gray-600 dark:text-gray-100 text-sm whitespace-pre-wrap'>
                {error}
              </div>
              <div
                className='text-white absolute top-1 right-1 cursor-pointer'
                onClick={() => {
                  setError('');
                }}
              >
                <CrossIcon />
              </div>
            </div>
          )}
          <div
            className={`mt-4 w-full m-auto  ${
              hideSideMenu
                ? 'md:max-w-5xl lg:max-w-5xl xl:max-w-6xl'
                : 'md:max-w-3xl lg:max-w-3xl xl:max-w-4xl'
            }`}
          >
            {/* Render the Turnstile CAPTCHA above the buttons */}
            <div className='flex justify-center my-4'>
              <Turnstile
                sitekey='0x4AAAAAAAzRsaZd0P9-qFot' // Your site key
                onSuccess={(token) => {
                  console.log('Turnstile success:', token);
                  // Handle the successful CAPTCHA verification
                }}
                onError={() => {
                  console.error('Turnstile error');
                  // Handle errors here
                }}
                onExpire={() => {
                  console.log('Turnstile expired');
                  // Handle expiration (e.g., prompt user to complete CAPTCHA again)
                }}
                options={{ theme: 'auto', retry: 'auto' }} // Optional settings
              />
            </div>

            {!useStore.getState().generating && (
              <div className='md:w-[calc(100%-50px)] flex gap-4 flex-wrap justify-center'>
                <DownloadChat saveRef={saveRef} />
                <CloneChat />
              </div>
            )}
          </div>
          <div className='w-full h-36'></div>
        </div>
      </ScrollToBottom>
    </div>
  );
};

export default ChatContent;
