import { defineStore } from 'pinia'
import { DateTime } from "luxon";
import { api, cookieHelper, hasError, translate } from '@common';
import { showToast } from '@/util';
import emitter from "@/event-bus";
import {
  getServerPermissionsFromRules,
  prepareAppPermissions,
  resetPermissions,
  setPermissions
} from '@/authorization';
import User from '@/types/User';

export const useAuthStore = defineStore('authStore', {
  state: () => ({
    current: {} as User,
    oms: '',
    token: {
      value: '',
      expiration: undefined
    },
    redirectUrl: '',
    maargOms: '',
    maargUrl: '',
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
      console.log('state', state)
      let baseURL = import.meta.env.VITE_VUE_APP_BASE_URL
      console.log('baseURL', baseURL)
      if (!baseURL) baseURL = state.oms
      return baseURL.startsWith('http') ? baseURL.includes('/api') ? baseURL : `${baseURL}/api/` : `https://${baseURL}.hotwax.io/api/`
    },
    getRedirectUrl: (state) => state.redirectUrl,
    getMaargOms: (state) => state.maargOms
  },
  actions: {
    setOMS(oms: string) {
      cookieHelper().set("oms", oms)
      this.oms = oms;
    },
    // Set the url in store to which the user needs to be redirect after login success
    setRedirectUrl(redirectUrl: string) {
      this.redirectUrl = redirectUrl
    },
    async login(username: string, password: string) {
      try {
        const resp = await api({
          url: "login",
          method: "post",
          data: {
            'USERNAME': username,
            'PASSWORD': password
          },
          baseURL: this.getBaseUrl
        });
        if (hasError(resp)) {
          showToast(translate('Sorry, your username or password is incorrect. Please try again.'));
          console.error("error", resp.data._ERROR_MESSAGE_);
          return Promise.reject(new Error(resp.data._ERROR_MESSAGE_));
        }

        await this.setToken(resp.data.token, resp.data.expirationTime)

        try {
          const userProfileResp = await api({
            url: "admin/user/profile",
            method: "get",
            baseUrl: this.maargUrl
          });
          this.current = userProfileResp.data
        } catch(error: any) {
          showToast(translate("Failed to fetch user profile information"));
          console.error("error", error);
          this.setToken("", undefined)
          return Promise.reject(new Error(error));
        }

        await this.getPermissions();

        // Handling case for warnings like password may expire in few days
        if (resp.data._EVENT_MESSAGE_ && resp.data._EVENT_MESSAGE_.startsWith("Alert:")) {
          // TODO Internationalise text
          showToast(translate(resp.data._EVENT_MESSAGE_));
        }
      } catch (error: any) {
        // If any of the API call in try block has status code other than 2xx it will be handled in common catch block.
        // TODO Check if handling of specific status codes is required.
        this.setToken("", undefined)
        showToast(translate('Something went wrong while login. Please contact administrator.'));
        console.error("error: ", error);
        return Promise.reject(new Error(error))
      }
    },
    async getPermissions() {
      // Prepare permissions list
      const serverPermissionsFromRules = [...new Set(getServerPermissionsFromRules())];
      const baseURL = this.getBaseUrl
      let serverPermissions = [] as any;

      // If the server specific permission list doesn't exist, getting server permissions will be of no use
      // It means there are no rules yet depending upon the server permissions.
      if (serverPermissionsFromRules && serverPermissionsFromRules.length == 0) return serverPermissions;
      // TODO pass specific permissionIds
      let resp;
        // TODO Make it configurable from the environment variables.
        // Though this might not be an server specific configuration, 
        // we will be adding it to environment variable for easy configuration at app level
        const viewSize = 200;

        try {
          const params = {
            "viewIndex": 0,
            viewSize,
            permissionIds: serverPermissionsFromRules
          }
          resp = await api({
            url: "getPermissions",
            method: "post",
            baseURL,
            data: params,
          })
          if(resp.status === 200 && resp.data.docs?.length && !hasError(resp)) {
            serverPermissions = resp.data.docs.map((permission: any) => permission.permissionId);
            const total = resp.data.count;
            const remainingPermissions = total - serverPermissions.length;
            if (remainingPermissions > 0) {
              // We need to get all the remaining permissions
              const apiCallsNeeded = Math.floor(remainingPermissions / viewSize) + ( remainingPermissions % viewSize != 0 ? 1 : 0);
              const responses = await Promise.all([...Array(apiCallsNeeded).keys()].map(async (index: any) => {
                const response = await api({
                  url: "getPermissions",
                  method: "post",
                  baseURL,
                  data: {
                    "viewIndex": index + 1,
                    viewSize,
                    permissionIds: serverPermissionsFromRules
                  }
                })
                if(!hasError(response)){
                  return Promise.resolve(response);
                  } else {
                  return Promise.reject(response);
                  }
              }))
              const permissionResponses = {
                success: [],
                failed: []
              }
              responses.reduce((permissionResponses: any, permissionResponse: any) => {
                if (permissionResponse.status !== 200 || hasError(permissionResponse) || !permissionResponse.data?.docs) {
                  permissionResponses.failed.push(permissionResponse);
                } else {
                  permissionResponses.success.push(permissionResponse);
                }
                return permissionResponses;
              }, permissionResponses)

              serverPermissions = permissionResponses.success.reduce((serverPermissions: any, response: any) => {
                serverPermissions.push(...response.data.docs.map((permission: any) => permission.permissionId));
                return serverPermissions;
              }, serverPermissions)

              // If partial permissions are received and we still allow user to login, some of the functionality might not work related to the permissions missed.
              // Show toast to user intimiting about the failure
              // Allow user to login
              // TODO Implement Retry or improve experience with show in progress icon and allowing login only if all the data related to user profile is fetched.
              if (permissionResponses.failed.length > 0) Promise.reject("Something went wrong while getting complete user permissions.");
            }
          }
          const appPermissions = prepareAppPermissions(serverPermissions);
          // Update the state with the fetched permissions
          this.permissions = appPermissions;
          // Set permissions in the authorization module
          setPermissions(appPermissions);
        } catch(error: any) {
          return Promise.reject(error);
        }
    },
    async samlLogin(token: string, expirationTime: string) {
      try {
        this.setToken(token, expirationTime)

        try {
          const userProfileResp = await api({
            url: "admin/user/profile",
            method: "get",
            baseUrl: this.maargUrl
          });
          this.current = userProfileResp.data
        } catch(error: any) {
          this.setToken("", undefined)
          showToast(translate("Failed to fetch user profile information"));
          console.error("error", error);
          return Promise.reject(new Error(error));
        }

        await this.getPermissions();
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
        let resp: any;

        // wrapping the parsing logic in try catch as in some case the logout api makes redirection, or fails when logout from maarg based apps, thus the logout process halts
        try {
          resp = await api({
            url: "logout",
            method: "get",
            baseURL: this.getBaseUrl
          });

          if(resp.status != 200) {
            throw resp.data;
          }

          // Added logic to remove the `//` from the resp as in case of get request we are having the extra characters and in case of post we are having 403
          resp = JSON.parse(resp.data.startsWith('//') ? resp.data.replace('//', '') : resp.data)
        } catch(err) {
          console.error('Error parsing data', err)
        }

        if(resp?.data?.logoutAuthType == 'SAML2SSO') {
          redirectionUrl = resp.data.logoutUrl
        }
      }

      // resetting the whole state except oms
      // TODO Check why $patch failed to update current and use
      this.current = {
        userFullName: "",
        timeZone: "",
        locale: "",
        partyId: "",
        userId: "",
        username: "",
        preferences: []
      }
      this.setToken("", undefined)
      this.redirectUrl = ''
      this.maargOms = ''
      this.maargUrl = ''
      resetPermissions();

      // clear the permissions state
      this.permissions = [];
      setPermissions([]);

      // If we get any url in logout api resp then we will redirect the user to the url
      if(redirectionUrl) {
        window.location.href = redirectionUrl
      }

      emitter.emit('dismissLoader')
      return redirectionUrl;
    },
    async setToken(token: any, expirationTime: any) {
      cookieHelper().set("token", token, expirationTime)
      this.token = {
        value: token,
        expiration: expirationTime
      }
    },
    async setCurrent(current: any) {
      this.current = current
    },
    async setMaargInstance(oms: string) {
      this.maargOms = oms
      this.maargUrl = oms.startsWith('http') ? oms.includes('/rest/s1') ? oms : `${oms}/rest/s1/` : `https://${oms}.hotwax.io/rest/s1/`;
      cookieHelper().set("maarg", this.maargOms)
    }
  },
  persist: true
})
