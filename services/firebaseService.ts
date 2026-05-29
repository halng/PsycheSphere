import { BlogPost, UserProfile, UserRole, WriterAccessRequest } from '../types';

const firebaseProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined;
const firebaseApiKey = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined;
const firestoreDatabaseId = (import.meta.env.VITE_FIREBASE_DATABASE_ID as string | undefined) || '(default)';

const baseUrl = firebaseProjectId
  ? `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/${firestoreDatabaseId}/documents`
  : '';

export const isFirebaseConfigured = Boolean(firebaseProjectId && firebaseApiKey);

export interface UserRecord {
  id: string;
  profile: UserProfile;
  role: UserRole;
  email?: string;
  writerRequest?: WriterAccessRequest;
  createdAt?: string;
  updatedAt?: string;
}

type FirestoreValue =
  | { stringValue: string }
  | { booleanValue: boolean }
  | { integerValue: string }
  | { doubleValue: number }
  | { nullValue: null }
  | { timestampValue: string }
  | { arrayValue: { values?: FirestoreValue[] } }
  | { mapValue: { fields: Record<string, FirestoreValue> } };

interface FirestoreDocument {
  name: string;
  fields?: Record<string, FirestoreValue>;
  createTime?: string;
  updateTime?: string;
}

const assertFirebaseConfig = () => {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase is not configured. Set VITE_FIREBASE_PROJECT_ID and VITE_FIREBASE_API_KEY.');
  }
};

const requestUrl = (path: string) => {
  const separator = path.includes('?') ? '&' : '?';
  return `${baseUrl}/${path}${separator}key=${encodeURIComponent(firebaseApiKey || '')}`;
};

const toFirestoreValue = (value: unknown): FirestoreValue => {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toFirestoreValue) } };
  }
  if (typeof value === 'object') {
    return {
      mapValue: {
        fields: Object.entries(value as Record<string, unknown>).reduce<Record<string, FirestoreValue>>((fields, [key, nestedValue]) => {
          if (nestedValue !== undefined) fields[key] = toFirestoreValue(nestedValue);
          return fields;
        }, {})
      }
    };
  }
  return { stringValue: String(value) };
};

const fromFirestoreValue = (value: FirestoreValue): unknown => {
  if ('stringValue' in value) return value.stringValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('nullValue' in value) return null;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(fromFirestoreValue);
  if ('mapValue' in value) {
    return Object.entries(value.mapValue.fields || {}).reduce<Record<string, unknown>>((data, [key, nestedValue]) => {
      data[key] = fromFirestoreValue(nestedValue);
      return data;
    }, {});
  }
  return null;
};

const documentIdFromName = (name: string) => name.split('/').pop() || '';

const serializeDocument = (data: Record<string, unknown>) => ({
  fields: Object.entries(data).reduce<Record<string, FirestoreValue>>((fields, [key, value]) => {
    if (value !== undefined) fields[key] = toFirestoreValue(value);
    return fields;
  }, {})
});

const deserializeDocument = <T extends { id?: string }>(doc: FirestoreDocument): T => {
  const data = Object.entries(doc.fields || {}).reduce<Record<string, unknown>>((result, [key, value]) => {
    result[key] = fromFirestoreValue(value);
    return result;
  }, {});

  return {
    id: (data.id as string | undefined) || documentIdFromName(doc.name),
    ...data
  } as T;
};

const firestoreFetch = async <T>(path: string, init?: RequestInit): Promise<T> => {
  assertFirebaseConfig();

  const response = await fetch(requestUrl(path), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    }
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Firestore request failed (${response.status}): ${message}`);
  }

  return response.json() as Promise<T>;
};

const listCollection = async <T extends { id?: string }>(collectionName: string): Promise<T[]> => {
  const response = await firestoreFetch<{ documents?: FirestoreDocument[] }>(collectionName);
  return (response.documents || []).map(deserializeDocument<T>);
};

const getDocument = async <T extends { id?: string }>(collectionName: string, id: string): Promise<T | null> => {
  try {
    const response = await firestoreFetch<FirestoreDocument>(`${collectionName}/${encodeURIComponent(id)}`);
    return deserializeDocument<T>(response);
  } catch (error) {
    if (error instanceof Error && error.message.includes('(404)')) return null;
    throw error;
  }
};

const setDocument = async <T extends { id: string }>(collectionName: string, id: string, data: T): Promise<T> => {
  const response = await firestoreFetch<FirestoreDocument>(`${collectionName}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(serializeDocument(data as Record<string, unknown>))
  });
  return deserializeDocument<T>(response);
};

const updateDocument = async <T extends { id: string }>(collectionName: string, id: string, data: Partial<T>): Promise<T> => {
  const fieldPaths = Object.keys(data).filter(key => data[key as keyof T] !== undefined);
  const updateMask = fieldPaths.map(path => `updateMask.fieldPaths=${encodeURIComponent(path)}`).join('&');
  const urlPath = `${collectionName}/${encodeURIComponent(id)}${updateMask ? `?${updateMask}` : ''}`;
  const response = await firestoreFetch<FirestoreDocument>(urlPath, {
    method: 'PATCH',
    body: JSON.stringify(serializeDocument(data as Record<string, unknown>))
  });
  return deserializeDocument<T>(response);
};

const deleteDocument = async (collectionName: string, id: string): Promise<void> => {
  await firestoreFetch(`${collectionName}/${encodeURIComponent(id)}`, { method: 'DELETE' });
};

export const postService = {
  list: () => listCollection<BlogPost>('posts'),
  get: (id: string) => getDocument<BlogPost>('posts', id),
  create: (post: BlogPost) => setDocument<BlogPost>('posts', post.id, post),
  update: (id: string, post: Partial<BlogPost>) => updateDocument<BlogPost>('posts', id, post),
  upsert: (post: BlogPost) => setDocument<BlogPost>('posts', post.id, post),
  delete: (id: string) => deleteDocument('posts', id)
};

export const userService = {
  list: () => listCollection<UserRecord>('users'),
  get: (id: string) => getDocument<UserRecord>('users', id),
  create: (user: UserRecord) => setDocument<UserRecord>('users', user.id, {
    ...user,
    createdAt: user.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }),
  update: (id: string, user: Partial<UserRecord>) => updateDocument<UserRecord>('users', id, {
    ...user,
    updatedAt: new Date().toISOString()
  }),
  upsert: (user: UserRecord) => setDocument<UserRecord>('users', user.id, {
    ...user,
    updatedAt: new Date().toISOString()
  }),
  delete: (id: string) => deleteDocument('users', id)
};

export const writerRequestService = {
  list: () => listCollection<WriterAccessRequest & { id: string }>('writerRequests'),
  get: (id: string) => getDocument<WriterAccessRequest & { id: string }>('writerRequests', id),
  upsert: (id: string, request: WriterAccessRequest) => setDocument('writerRequests', id, { id, ...request }),
  update: (id: string, request: Partial<WriterAccessRequest>) => updateDocument<WriterAccessRequest & { id: string }>('writerRequests', id, { id, ...request })
};
