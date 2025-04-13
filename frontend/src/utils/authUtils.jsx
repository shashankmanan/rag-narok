import axios from 'axios';

// Regular function instead of useCallback
export const login = async (username, password, navigate) => {
  try {
    const response = await axios.post('http://localhost:5050/user/login', {
      username,
      password
    });
    
    localStorage.setItem('ragnarok_token', response.data.access_token.access_token);
    localStorage.setItem('ragnarok_user', JSON.stringify({
      username: response.data.username,
    }));
    
    navigate('/dashboard', { replace: true });
    return response.data;
  } catch (error) {
    console.error('Login failed', error);
    throw error;
  }
};

export const logout = () => {
  localStorage.removeItem('ragnarok_token');
  localStorage.removeItem('ragnarok_user');
  window.location.href = '/'; 
};

export const registerUser = async (formData) => {
  console.log("registering>>>")
  const baseUrl = 'http://localhost:5050/user/register'
  const response = await axios.post(baseUrl,formData);
}