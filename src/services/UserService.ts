import { api, client, hasError } from '@/adapter';
import { useAuthStore } from '@/store/auth';

const login = async (username: string, password: string): Promise<any> => {
  return api({
    url: "login",
    method: "post",
    data: {
      'USERNAME': username,
      'PASSWORD': password
    }
  });
}

const getUserProfile = async (token: any): Promise<any> => {
  const authStore = useAuthStore()
  const baseURL = authStore.getBaseUrl

  try {
    const resp = await client({
      url: "user-profile",
      method: "get",
      baseURL,
      headers: {
        Authorization:  'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    });
    if (hasError(resp)) return Promise.reject("Error getting user profile: " + JSON.stringify(resp.data));
    return Promise.resolve(resp.data)
  } catch(error: any) {
    return Promise.reject(error)
  }
}

const checkLoginOptions = async (oms: string): Promise<any> => {
  return api({
    url: "/checkLoginOptions",
    method: "POST",
    data: oms
  });
}

const prepareSamlLogin = async (authUrl: string): Promise<any> => {
  return api({
    url: authUrl,
    method: "get", // TODO check if post or get
  });
}

export const UserService = {
  getUserProfile,
  checkLoginOptions,
  login,
  prepareSamlLogin
}