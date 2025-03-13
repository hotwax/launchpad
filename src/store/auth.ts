import { defineStore } from 'pinia'
import { DateTime } from "luxon";
import { UserService } from '@/services/UserService';
import { hasError, logout, updateInstanceUrl, updateToken } from '@/adapter';
import { showToast } from '@/util';
import { translate } from '@/i18n'
import emitter from "@/event-bus";
import {
  getServerPermissionsFromRules,
  prepareAppPermissions,
  resetPermissions,
  setPermissions
} from '@/authorization';

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
    permissions: [] as any
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
        updateToken(this.token.value)

        // Getting the permissions list from server
        const permissionId = process.env.VUE_APP_PERMISSION_ID;
        // Prepare permissions list
        const serverPermissionsFromRules = getServerPermissionsFromRules();
        if (permissionId) serverPermissionsFromRules.push(permissionId);
        const serverPermissions = await UserService.getUserPermissions({
          permissionIds: [...new Set(serverPermissionsFromRules)]
        }, this.token);
        const appPermissions = prepareAppPermissions(serverPermissions);
        // Checking if the user has permission to access the app
        // If there is no configuration, the permission check is not enabled
        if (permissionId) {
          // As the token is not yet set in the state passing token headers explicitly
          const hasPermission = appPermissions.some((appPermission: any) => appPermission.action === permissionId );
          // If there are any errors or permission check fails do not allow user to login
          if (!hasPermission) {
            const permissionError = 'You do not have permission to access the app.';
            showToast(translate(permissionError));
            return Promise.reject(new Error(permissionError));
          }
        }
        // Update the state with the fetched permissions
        this.permissions = serverPermissions;
        // Set permissions in the authorization module
        setPermissions(appPermissions);

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
      resetPermissions();

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
    }
  },
  persist: true
})