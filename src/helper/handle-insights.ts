const baseUri = 'https://insights.decla.red';
const type = 'sdf-2d-demo';

export const handleInsights = async (initialData: any): Promise<(data: any) => void> => {
  try {
    const sessionId = await createSession(initialData);
    return (data) => createFrame(sessionId, data);
  } catch {
    return () => null;
  }
};

const createSession = async (data: any): Promise<string> => {
  const response = await sendPostRequest(`${baseUri}/${type}/sessions/`, data);
  const { sessionId } = await response.json();
  return sessionId;
};

const createFrame = (sessionId: string, data: any): Promise<unknown> =>
  sendPostRequest(`${baseUri}/${type}/sessions/${sessionId}`, data).catch();

const sendPostRequest = async (uri: string, data: any): Promise<Response> =>
  await fetch(uri, {
    method: 'POST',
    mode: 'cors',
    redirect: 'follow',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
