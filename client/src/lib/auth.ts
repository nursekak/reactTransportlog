export const getAuthHeaders = () => {
  return {
    'Content-Type': 'application/json',
  };
};

export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/auth/me', {
      credentials: 'include',
    });
    return response.ok;
  } catch {
    return false;
  }
};
