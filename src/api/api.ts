import { ShareGPTSubmitBodyInterface } from '@type/api';
import { ConfigInterface, MessageInterface } from '@type/chat';
import { isAzureEndpoint } from '@utils/api';

declare const grecaptcha: any;

// Function to execute reCAPTCHA
const executeRecaptcha = async (action: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (typeof grecaptcha !== 'undefined') {
      grecaptcha
        .ready(() => {
          grecaptcha
            .execute('6Lf9B3oqAAAAAPemzZE9SYPkj3lYSlqYbf7qun9K', { action })
            .then((token: string) => {
              resolve(token);
            })
            .catch((error: any) => {
              reject(error);
            });
        })
        .catch((error: any) => {
          reject(error);
        });
    } else {
      // If grecaptcha is not defined, resolve with an empty string or handle accordingly
      resolve('');
    }
  });
};

// Removed the getTurnstileToken function since we now use the token from state

// Function to get session cookie
const getSessionCookie = (): string | undefined => {
  const name = 'session_id=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return undefined;
};

// Function to get chat completion
export const getChatCompletion = async (
  endpoint: string,
  messages: MessageInterface[],
  config: ConfigInterface,
  turnstileToken: string | null, // Accept turnstileToken as an argument
  apiKey?: string,
  customHeaders?: Record<string, string>
) => {
  const recaptchaToken = await executeRecaptcha('getChatCompletion');
  const sessionCookie = getSessionCookie();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  // Create a new config object without frequency_penalty and presence_penalty
  const { frequency_penalty, presence_penalty, ...modifiedConfig } = config;

  const requestBody = {
    messages,
    ...modifiedConfig, // Use modified config that excludes the penalties
    max_tokens: undefined,
    session: sessionCookie,
    recaptcha_token: recaptchaToken,
    turnstile_token: turnstileToken, // Include the Turnstile token
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) throw new Error(await response.text());

  const data = await response.json();
  return data;
};

// Function to get chat completion stream
export const getChatCompletionStream = async (
  endpoint: string,
  messages: MessageInterface[],
  config: ConfigInterface,
  turnstileToken: string | null, // Accept turnstileToken as an argument
  apiKey?: string,
  customHeaders?: Record<string, string>
) => {
  const recaptchaToken = await executeRecaptcha('getChatCompletionStream');
  const sessionCookie = getSessionCookie();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  // Create a new config object without frequency_penalty and presence_penalty
  const { frequency_penalty, presence_penalty, ...modifiedConfig } = config;

  const requestBody = {
    messages,
    ...modifiedConfig, // Use modified config that excludes the penalties
    max_tokens: undefined,
    stream: true,
    session: sessionCookie,
    recaptcha_token: recaptchaToken,
    turnstile_token: turnstileToken, // Include the Turnstile token
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  });

  if (response.status === 404 || response.status === 405) {
    const text = await response.text();
    if (text.includes('model_not_found')) {
      throw new Error(
        text +
          '\nMessage from Better ChatGPT:\nPlease ensure that you have access to the GPT-4 API!'
      );
    } else {
      throw new Error(
        'Message from Better ChatGPT:\nInvalid API endpoint! We recommend you to check your free API endpoint.'
      );
    }
  }

  if (response.status === 429 || !response.ok) {
    const text = await response.text();
    let error = text;
    if (text.includes('insufficient_quota')) {
      error +=
        '\nMessage from Better ChatGPT:\nWe recommend changing your API endpoint or API key';
    } else if (response.status === 429) {
      error += '\nRate limited!';
    }
    throw new Error(error);
  }

  const stream = response.body;
  return stream;
};

// Function to submit to ShareGPT
export const submitShareGPT = async (
  body: ShareGPTSubmitBodyInterface,
  turnstileToken: string | null // Accept turnstileToken as an argument
) => {
  const recaptchaToken = await executeRecaptcha('submitShareGPT');
  const sessionCookie = getSessionCookie();

  const requestBody = {
    ...body,
    recaptcha_token: recaptchaToken,
    turnstile_token: turnstileToken, // Include the Turnstile token
    session: sessionCookie,
  };

  const request = await fetch('https://sharegpt.com/api/conversations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!request.ok) {
    // Handle errors appropriately
    const errorText = await request.text();
    throw new Error(`Error submitting to ShareGPT: ${errorText}`);
  }

  const response = await request.json();
  const { id } = response;
  const url = `https://shareg.pt/${id}`;
  window.open(url, '_blank');
};
