import { ShareGPTSubmitBodyInterface } from '@type/api';
import { ConfigInterface, MessageInterface, ModelOptions } from '@type/chat';
import { isAzureEndpoint } from '@utils/api';

declare const grecaptcha: any;
//test
const executeRecaptcha = async (action: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    grecaptcha.ready(() => {
      grecaptcha.execute('6Lf9B3oqAAAAAPemzZE9SYPkj3lYSlqYbf7qun9K', { action }).then((token: string) => {
        resolve(token);
      }).catch((error: any) => {
        reject(error);
      });
    });
  });
};

const getTurnstileToken = (): string | null => {
  const turnstileInput = document.querySelector(
    '.cf-turnstile input[name="cf-turnstile-response"]'
  ) as HTMLInputElement;
  return turnstileInput ? turnstileInput.value : null;
};

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

export const getChatCompletion = async (
  endpoint: string,
  messages: MessageInterface[],
  config: ConfigInterface,
  apiKey?: string,
  customHeaders?: Record<string, string>
) => {
  const recaptchaToken = await executeRecaptcha('getChatCompletion');
  const sessionCookie = getSessionCookie();
  const turnstileToken = getTurnstileToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  // Create a new config object without frequency_penalty and presence_penalty
  const { frequency_penalty, presence_penalty, ...modifiedConfig } = config;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      messages,
      ...modifiedConfig, // Use modified config that excludes the penalties
      max_tokens: undefined,
      session: sessionCookie,
      recaptcha_token: recaptchaToken,
      turnstile_token: turnstileToken
    }),
  });
  if (!response.ok) throw new Error(await response.text());

  const data = await response.json();
  return data;
};

export const getChatCompletionStream = async (
  endpoint: string,
  messages: MessageInterface[],
  config: ConfigInterface,
  apiKey?: string,
  customHeaders?: Record<string, string>
) => {
  const recaptchaToken = await executeRecaptcha('getChatCompletionStream');
  const sessionCookie = getSessionCookie();
  const turnstileToken = getTurnstileToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  // Create a new config object without frequency_penalty and presence_penalty
  const { frequency_penalty, presence_penalty, ...modifiedConfig } = config;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      messages,
      ...modifiedConfig, // Use modified config that excludes the penalties
      max_tokens: undefined,
      stream: true,
      session: sessionCookie,
      recaptcha_token: recaptchaToken,
      turnstile_token: turnstileToken
    }),
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

export const submitShareGPT = async (body: ShareGPTSubmitBodyInterface) => {
  const recaptchaToken = await executeRecaptcha('submitShareGPT');
  const sessionCookie = getSessionCookie();

  const request = await fetch('https://sharegpt.com/api/conversations', {
    body: JSON.stringify({ ...body, recaptcha_token: recaptchaToken, session: sessionCookie }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  const response = await request.json();
  const { id } = response;
  const url = `https://shareg.pt/${id}`;
  window.open(url, '_blank');
};
