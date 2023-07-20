import { defineStore } from 'pinia'
import { DateTime } from "luxon";
import { UserService } from '@/services/UserService';
import { hasError, updateInstanceUrl, updateToken } from '@/adapter';
import { showToast } from '@/util';
import { translate } from '@/i18n'

export const useAuthStore = defineStore('authStore', {
  state: () => ({
    current: {} as any,
    oms: '',
    token: {
      value: '',
      expiration: undefined
    }
  }),
  getters: {
    isAuthenticated: (state) => {
      let isTokenExpired = false;
      if (state.token.expiration) {
        const currTime = DateTime.now().toMillis();
        isTokenExpired = state.token.expiration < currTime;
      }
      return state.token.value && !isTokenExpired;
    },
    getOMS: (state) => state.oms,
    getBaseUrl: (state) => {
      let baseURL = process.env.VUE_APP_BASE_URL
      if (!baseURL) baseURL = state.oms
      return baseURL.startsWith('http') ? baseURL : `https://${baseURL}.hotwax.io/api/`
    }
  },
  actions: {
    setOMS(oms: string) {
      this.oms = oms;
      updateInstanceUrl(oms)
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
    async logout() {
      // resetting the whole state except oms
      this.$patch({
        current: {},
        token: {
          value: '',
          expiration: undefined
        }
      })
      updateToken('');
    }
  },
  persist: true
})