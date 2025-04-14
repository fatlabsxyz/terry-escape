export function passTime(ms: number): Promise<void> {
  return new Promise((res, rej) => {
    setTimeout(res, ms)
  })
}

export function setEqual<T>(set1: Set<T>, set2: Set<T>): boolean {
  // we need compile option "lib": "esnext" for symmetricDifference
  return set1.symmetricDifference(set2).size === 0
}

interface AuthResponse {
  message: string;
  token: string;
}

export interface AuthRequestData {
  name: string;
}

async function getAuthToken(data: AuthRequestData): Promise<string | null> {
  try {
    const response = await fetch('http://localhost:2448/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Request failed with status ${response.status}: ${errorText}`);
    }

    const result: AuthResponse = await response.json();
    console.log('Received token:', result.token);
    return result.token;
  } catch (error) {
    console.error('Request failed:', error);
      return null;
  }
} 

