const baseUri = 'https://insights.decla.red';
const type = 'sdf-2d-demo';

export const handleInsights = async (initialData: any): Promise<(data: any) => void> => {
  const sessionId = await createSession(initialData);
  return (data) => createFrame(sessionId, data);
};

const createSession = async (data: any): Promise<string> => {
  const response = await sendPostRequest(`${baseUri}/${type}/sessions/`, data);
  const { sessionId } = await response.json();
  return sessionId;
};

const createFrame = async (sessionId: string, data: any): Promise<unknown> =>
  await sendPostRequest(`${baseUri}/${type}/sessions/${sessionId}`, data);

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
