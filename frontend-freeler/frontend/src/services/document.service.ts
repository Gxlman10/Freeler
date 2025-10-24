const GRAPH_PERU_ENDPOINT = 'https://graphperu.daustinn.com/api/query';

type DniResponse = {
  documentID: string;
  names?: string;
  surnames?: string;
  fullName?: string;
  paternalLastName?: string;
  maternalLastName?: string;
  error?: string;
};

type RucResponse = {
  documentID: string;
  name?: string;
  address?: string;
  district?: string;
  province?: string;
  region?: string;
  error?: string;
};

export const queryDocument = async <T extends DniResponse | RucResponse>(
  documentId: string,
): Promise<T | null> => {
  try {
    const response = await fetch(`${GRAPH_PERU_ENDPOINT}/${documentId}`);
    if (!response.ok) {
      return null;
    }
    const data = (await response.json()) as T;
    if ('error' in data && data.error) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
};
