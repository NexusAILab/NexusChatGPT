import { ShareGPTSubmitBodyInterface } from '@type/api';
import { ConfigInterface, MessageInterface, ModelOptions } from '@type/chat';
import { isAzureEndpoint } from '@utils/api';

declare const grecaptcha: any;

const executeRecaptcha = async (action: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    grecaptcha.ready(() => {
      grecaptcha
        .execute('6LeIzz8qAAAAAFx2MY7vm0pLQpzWM_HFrK1sW8y5', { action })
        .then((token: string) => {
          resolve(token);
        })
        .catch((error: any) => {
          reject(error);
        });
    });
  });
};

const getSessionCookie = (): string | undefined => {
  const name = 'session=';
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

const makeRequest = (
  method: string,
  url: string,
  headers: Record<string, string>,
  body: any
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.withCredentials = true;

    for (const key in headers) {
      xhr.setRequestHeader(key, headers[key]);
    }

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error(xhr.responseText));
        }
      }
    };

    xhr.send(JSON.stringify(body));
  });
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

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  if (sessionCookie) headers['Cookie'] = `session=${sessionCookie}`; // Add session cookie to headers

  if (isAzureEndpoint(endpoint) && apiKey) {
    headers['api-key'] = apiKey;

    const modelmapping: Partial<Record<ModelOptions, string>> = {
      'gpt-3.5-turbo': 'gpt-35-turbo',
      'gpt-3.5-turbo-16k': 'gpt-35-turbo-16k',
      'gpt-3.5-turbo-1106': 'gpt-35-turbo-1106',
      'gpt-3.5-turbo-0125': 'gpt-35-turbo-0125',
    };

    const model = modelmapping[config.model] || config.model;

    const apiVersion =
      model === 'gpt-4' || model === 'gpt-4-32k'
        ? '2023-07-01-preview'
        : '2023-03-15-preview';

    const path = `openai/deployments/${model}/chat/completions?api-version=${apiVersion}`;

    if (!endpoint.endsWith(path)) {
      if (!endpoint.endsWith('/')) {
        endpoint += '/';
      }
      endpoint += path;
    }
  }

  // Create a new config object without frequency_penalty and presence_penalty
  const { frequency_penalty, presence_penalty, ...modifiedConfig } = config;

  const body = {
    messages,
    ...modifiedConfig, // Use modified config that excludes the penalties
    max_tokens: undefined,
    session: sessionCookie,
    recaptcha_token: recaptchaToken,
  };

  return makeRequest('POST', endpoint, headers, body);
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

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  if (sessionCookie) headers['Cookie'] = `session=${sessionCookie}`; // Add session cookie to headers

  if (isAzureEndpoint(endpoint) && apiKey) {
    headers['api-key'] = apiKey;

    const modelmapping: Partial<Record<ModelOptions, string>> = {
      'gpt-3.5-turbo': 'gpt-35-turbo',
      'gpt-3.5-turbo-16k': 'gpt-35-turbo-16k',
    };

    const model = modelmapping[config.model] || config.model;

    const apiVersion =
      model === 'gpt-4' || model === 'gpt-4-32k'
        ? '2023-07-01-preview'
        : '2023-03-15-preview';

    const path = `openai/deployments/${model}/chat/completions?api-version=${apiVersion}`;

    if (!endpoint.endsWith(path)) {
      if (!endpoint.endsWith('/')) {
        endpoint += '/';
      }
      endpoint += path;
    }
  }

  // Create a new config object without frequency_penalty and presence_penalty
  const { frequency_penalty, presence_penalty, ...modifiedConfig } = config;

  const body = {
    messages,
    ...modifiedConfig, // Use modified config that excludes the penalties
    max_tokens: undefined,
    stream: true,
    session: sessionCookie,
    recaptcha_token: recaptchaToken,
  };

  return makeRequest('POST', endpoint, headers, body);
};

export const submitShareGPT = async (body: ShareGPTSubmitBodyInterface) => {
  const recaptchaToken = await executeRecaptcha('submitShareGPT');
  const sessionCookie = getSessionCookie();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (sessionCookie) headers['Cookie'] = `session=${sessionCookie}`; // Add session cookie to headers

  const requestBody = {
    ...body,
    recaptcha_token: recaptchaToken,
    session: sessionCookie,
  };

  const response = await makeRequest('POST', 'https://sharegpt.com/api/conversations', headers, requestBody);
  const { id } = response;
  const url = `https://shareg.pt/${id}`;
  window.open(url, '_blank');
};
