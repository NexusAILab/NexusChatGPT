export const officialAPIEndpoint = 'https://rural-heath-nexusai4349-d414845a.koyeb.app/nexus/v1/chat/completions';
export const defaultAPIEndpoint =
  import.meta.env.VITE_DEFAULT_API_ENDPOINT || officialAPIEndpoint;

export const availableEndpoints = [officialAPIEndpoint];
