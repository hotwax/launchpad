import { defineStore } from 'pinia'
import { DateTime } from "luxon";
import { UserService } from '@/services/UserService';
import { hasError, logout, updateInstanceUrl, updateToken } from '@/adapter';
import { showToast } from '@/util';
import { translate } from '@/i18n'
import emitter from "@/event-bus";

export const useAuthStore = defineStore('authStore', {
  state: () => ({
    current: {} as any,
    oms: '',
    token: {
      value: '',
      expiration: undefined
    },
    redirectUrl: '',
    maargOms: '',
    permissions: [] as string[]
  }),
  getters: {
    isAuthenticated: (state) => {
      let isTokenExpired = false;
      if (state.token.expiration) {
        const currTime = DateTime.now().toMillis();
        isTokenExpired = state.token.expiration < currTime;
      }
      return !!(state.token.value && !isTokenExpired);
    },
    getOMS: (state) => state.oms,
    getBaseUrl: (state) => {
      let baseURL = process.env.VUE_APP_BASE_URL
      if (!baseURL) baseURL = state.oms
      return baseURL.startsWith('http') ? baseURL.includes('/api') ? baseURL : `${baseURL}/api/` : `https://${baseURL}.hotwax.io/api/`
    },
    getRedirectUrl: (state) => state.redirectUrl,
    getMaargOms: (state) => state.maargOms,
    getUserPermissions: (state) => state.permissions
  },
  actions: {
    setOMS(oms: string) {
      this.oms = oms;
      updateInstanceUrl(oms)
    },
    setRedirectUrl(redirectUrl: string) {
      this.redirectUrl = redirectUrl
    },
    async login(username: string, password: string) {
      try {
        const resp = await UserService.login(username, password);
        if (hasError(resp)) {
          showToast(translate('Sorry, your username or password is incorrect. Please try again.'));
          console.error("error", resp.data._ERROR_MESSAGE_);
          return Promise.reject(new Error(resp.data._ERROR_MESSAGE_));
        }

        this.token = {
          value: resp.data.token,
          expiration: resp.data.expirationTime
        }

        this.current = await UserService.getUserProfile(this.token.value);
        await this.setUserPermissions();
        updateToken(this.token.value)
        // Handling case for warnings like password may expire in few days
        if (resp.data._EVENT_MESSAGE_ && resp.data._EVENT_MESSAGE_.startsWith("Alert:")) {
          // TODO Internationalise text
          showToast(translate(resp.data._EVENT_MESSAGE_));
        }
      } catch (error: any) {
        // If any of the API call in try block has status code other than 2xx it will be handled in common catch block.
        // TODO Check if handling of specific status codes is required.
        showToast(translate('Something went wrong while login. Please contact administrator.'));
        console.error("error: ", error);
        return Promise.reject(new Error(error))
      }
    },
    async samlLogin(token: string, expirationTime: string) {
      try {
        this.token = {
          value: token,
          expiration: expirationTime as any
        }
  
        this.current = await UserService.getUserProfile(this.token.value);
        updateToken(this.token.value)
      } catch (error: any) {
        // If any of the API call in try block has status code other than 2xx it will be handled in common catch block.
        // TODO Check if handling of specific status codes is required.
        showToast(translate('Something went wrong while login. Please contact administrator.'));
        console.error("error: ", error);
        return Promise.reject(new Error(error))
      }
    },
    async logout(payload?: any) {
      // store the url on which we need to redirect the user after logout api completes in case of SSO enabled
      let redirectionUrl = ""

      // Calling the logout api to flag the user as logged out, only when user is authorised
      // if the user is already unauthorised then not calling the logout api as it returns 401 again that results in a loop, thus there is no need to call logout api if the user is unauthorised
      if(!payload?.isUserUnauthorised) {
        emitter.emit("presentLoader",{ message: "Logging out...", backdropDismiss: false });
        let resp;

        // wrapping the parsing logic in try catch as in some case the logout api makes redirection, or fails when logout from maarg based apps, thus the logout process halts
        try {
          resp = await logout();

          // Added logic to remove the `//` from the resp as in case of get request we are having the extra characters and in case of post we are having 403
          resp = JSON.parse(resp.startsWith('//') ? resp.replace('//', '') : resp)
        } catch(err) {
          console.error('Error parsing data', err)
        }

        if(resp?.logoutAuthType == 'SAML2SSO') {
          redirectionUrl = resp.logoutUrl
        }
      }

      // resetting the whole state except oms
      // TODO Check why $patch failed to update current and use
      this.current = {}
      this.token = {
        value: '',
        expiration: undefined
      }
      this.redirectUrl = ''
      this.maargOms = ''
      updateToken('');

      // If we get any url in logout api resp then we will redirect the user to the url
      if(redirectionUrl) {
        window.location.href = redirectionUrl
      }

      emitter.emit('dismissLoader')
      return redirectionUrl;
    },
    async setToken(token: any, expirationTime: any) {
      this.token = {
        value: token,
        expiration: expirationTime
      }
      updateToken(token)
    },
    async setCurrent(current: any) {
      this.current = current
    },
    async setMaargInstance(url: string) {
      this.maargOms = url
    },
    async setUserPermissions() {
      try {
        this.permissions = await UserService.getUserPermissions(this.token.value);
      } catch (error: any) {
        showToast(translate('Something went wrong while login. Please contact administrator.'));
        console.error("error: ", error);
        return Promise.reject(new Error(error))
      }
    },
  },
  persist: true
})