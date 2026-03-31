import { api, commonUtil, cookieHelper, logger, translate } from "@common";
import { Settings } from "luxon";
import { defineStore } from "pinia"
import {
  getServerPermissionsFromRules,
  prepareAppPermissions,
  setPermissions
} from "@/authorization";
import User from "@/types/User";
import { showToast } from "@/util";

export const useUserStore = defineStore("user", {
  state: () => ({
    current: {} as User,
    redirectUrl: "",
    permissions: [] as any
  }),
  getters: {
    getRedirectUrl: (state) => state.redirectUrl,
    getPermissions: (state: any) => state.permissions
  },
  actions: {
    setOMS(oms: string) {
      cookieHelper().set("oms", oms)
    },
    // Set the url in store to which the user needs to be redirect after login success
    // TODO: remove redirectUrl support once all the apps are migrated to the new framework
    setRedirectUrl(redirectUrl: string) {
      this.redirectUrl = redirectUrl
    },
    async login(username: string, password: string) {
      try {
        const resp = await api({
          url: "login",
          method: "post",
          data: {
            "USERNAME": username,
            "PASSWORD": password
          },
          baseURL: commonUtil.getOmsURL()
        });
        if(commonUtil.hasError(resp)) {
          showToast(translate("Sorry, your username or password is incorrect. Please try again."));
          logger.error("error", resp.data._ERROR_MESSAGE_);

          return Promise.reject(new Error(resp.data._ERROR_MESSAGE_));
        }

        await this.setToken(resp.data.token, resp.data.expirationTime)

        try {
          const userProfileResp = await api({
            url: "admin/user/profile",
            method: "get",
            baseUrl: commonUtil.getMaargBaseURL()
          });
          this.current = userProfileResp.data
        } catch (error: any) {
          showToast(translate("Failed to fetch user profile information"));
          logger.error("error", error);
          await this.setToken("", undefined)

          return Promise.reject(new Error(error));
        }

        await this.fetchPermissions();

        // Handling case for warnings like password may expire in few days
        if(resp.data._EVENT_MESSAGE_ && resp.data._EVENT_MESSAGE_.startsWith("Alert:")) {
          // TODO Internationalise text
          showToast(translate(resp.data._EVENT_MESSAGE_));
        }
      } catch (error: any) {
        // If any of the API call in try block has status code other than 2xx it will be handled in common catch block.
        // TODO Check if handling of specific status codes is required.
        await this.setToken("", undefined)
        showToast(translate("Something went wrong while login. Please contact administrator."));
        logger.error("error: ", error);

        return Promise.reject(new Error(error))
      }
    },
    async fetchPermissions() {
      // Prepare permissions list
      const serverPermissionsFromRules = [...new Set(getServerPermissionsFromRules())];
      const baseURL = commonUtil.getOmsURL()
      let serverPermissions = [] as any;

      // If the server specific permission list doesn't exist, getting server permissions will be of no use
      // It means there are no rules yet depending upon the server permissions.
      if(serverPermissionsFromRules && serverPermissionsFromRules.length == 0) {
        return serverPermissions;
      }
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
        if(resp.status === 200 && resp.data.docs?.length && !commonUtil.hasError(resp)) {
          serverPermissions = resp.data.docs.map((permission: any) => permission.permissionId);
          const total = resp.data.count;
          const remainingPermissions = total - serverPermissions.length;
          if(remainingPermissions > 0) {
            // We need to get all the remaining permissions
            const apiCallsNeeded = Math.floor(remainingPermissions / viewSize) + (remainingPermissions % viewSize != 0 ? 1 : 0);
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
              if(!commonUtil.hasError(response)) {
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
              if(permissionResponse.status !== 200 || commonUtil.hasError(permissionResponse) || !permissionResponse.data?.docs) {
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
            if(permissionResponses.failed.length > 0) {
              Promise.reject("Something went wrong while getting complete user permissions.")
            };
          }
        }
        const appPermissions = prepareAppPermissions(serverPermissions);
        // Update the state with the fetched permissions
        this.permissions = appPermissions;
        // Set permissions in the authorization module
        setPermissions(appPermissions);
      } catch (error: any) {
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
            baseUrl: commonUtil.getMaargBaseURL()
          });
          this.current = userProfileResp.data
        } catch (error: any) {
          this.setToken("", undefined)
          showToast(translate("Failed to fetch user profile information"));
          logger.error("error", error);

          return Promise.reject(new Error(error));
        }

        await this.getPermissions();
      } catch (error: any) {
        // If any of the API call in try block has status code other than 2xx it will be handled in common catch block.
        // TODO Check if handling of specific status codes is required.
        showToast(translate("Something went wrong while login. Please contact administrator."));
        logger.error("error: ", error);

        return Promise.reject(new Error(error))
      }
    },
    async fetchUserProfile() {
      try {
        const userProfileResp = await api({
          url: "admin/user/profile",
          method: "get",
          baseUrl: commonUtil.getMaargURL()
        });
        this.current = userProfileResp.data

        if(this.current.timeZone) {
          Settings.defaultZone = this.current.timeZone;
        }
      } catch (error: any) {
        showToast(translate("Failed to fetch user profile information"));
        console.error("error", error);
        useAuth().clearAuth();

        return Promise.reject(new Error(error));
      }
    },
    setToken(token: any, expirationTime: any) {
      cookieHelper().set("token", token, expirationTime)
    },
    setCurrent(current: any) {
      this.current = current
    },
    setMaargInstance(oms: string) {
      const maargOms = oms
      // const maargUrl = oms.startsWith("http") ? oms.includes("/rest/s1") ? oms : `${oms}/rest/s1/` : `https://${oms}.hotwax.io/rest/s1/`;
      cookieHelper().set("maarg", maargOms)
    }
  },
  persist: true
})
