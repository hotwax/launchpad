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

const checkLoginOptions = async (): Promise<any> => {
  return api({
    url: "/checkLoginOptions",
    method: "GET"
  });
}

const resetPassword = async(params: any) : Promise<any> => {
  return api({
    url: "service/resetPassword",
    method: "POST",
    data: params
  })
}

const forgotPassword = async(params: any) : Promise<any> => {
  return api({
    url: "service/sendResetPasswordMailToPartyV2",
    method: "post",
    data: params
  })
}

export const UserService = {
  getUserProfile,
  checkLoginOptions,
  forgotPassword,
  login,
  resetPassword
}