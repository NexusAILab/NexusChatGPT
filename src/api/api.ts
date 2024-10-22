import { ShareGPTSubmitBodyInterface } from '@type/api';
import { ConfigInterface, MessageInterface, ModelOptions } from '@type/chat';
import { isAzureEndpoint } from '@utils/api';

declare const grecaptcha: any;

const executeRecaptcha = async (action: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    grecaptcha.ready(() => {
      grecaptcha.execute('6LeIzz8qAAAAAFx2MY7vm0pLQpzWM_HFrK1sW8y5', { action }).then((token: string) => {
        resolve(token);
      }).catch((error: any) => {
        reject(error);
      });
    });
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

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Recaptcha-Token': recaptchaToken,
    ...customHeaders,
  };
  //const apiKey = "sk-G74ZCYvhv6DHlyWRak67hRLK2XD8A9Q_r21uHbt1KDoqkQEO"
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

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

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      messages,
      ...modifiedConfig, // Use modified config that excludes the penalties
      max_tokens: undefined,
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

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Recaptcha-Token': recaptchaToken,
    ...customHeaders,
  };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

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

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      messages,
      ...modifiedConfig, // Use modified config that excludes the penalties
      max_tokens: undefined,
      stream: true,
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

  const request = await fetch('https://sharegpt.com/api/conversations', {
    body: JSON.stringify({ ...body, recaptcha_token: recaptchaToken }),
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
