import { api, commonUtil, cookieHelper, translate } from "@common";
import { Settings } from "luxon";
import { defineStore } from "pinia"
import { useAuth } from "@/composables/auth";
import User from "@/types/User";
import { showToast } from "@/util";

export const useUserStore = defineStore("user", {
  state: () => ({
    current: {} as User,
    redirectUrl: "",
    permissions: [] as any,
    oms: ""
  }),
  getters: {
    getRedirectUrl: (state) => state.redirectUrl,
    getPermissions: (state: any) => state.permissions,
    hasPermission: (state: any) => (permissionId: string): boolean => {
      const permissions = state.permissions;

      if(!permissionId) {
        return true;
      }

      // Handle OR/AND logic in permission string
      if(permissionId.includes(" OR ")) {
        const parts = permissionId.split(" OR ");

        return parts.some((part: string) => useUserStore().hasPermission(part.trim()));
      }

      if(permissionId.includes(" AND ")) {
        const parts = permissionId.split(" AND ");

        return parts.every((part: string) => useUserStore().hasPermission(part.trim()));
      }

      return permissions.includes(permissionId);
    }
  },
  actions: {
    // Set the url in store to which the user needs to be redirect after login success
    // TODO: remove redirectUrl support once all the apps are migrated to the new framework
    setRedirectUrl(redirectUrl: string) {
      this.redirectUrl = redirectUrl
    },
    async fetchPermissions() {
      const serverPermissions = [] as any;
      const viewSize = 200;
      let viewIndex = 0;

      try {
        let resp;
        do {
          resp = await api({
            url: "getPermissions",
            method: "POST",
            baseURL: commonUtil.getOmsURL(),
            data: { viewIndex, viewSize }
          }) as any

          if(resp.data.docs?.length && !commonUtil.hasError(resp)) {
            serverPermissions.push(...resp.data.docs.map((permission: any) => permission.permissionId));
            viewIndex++;
          } else {
            resp = null;
          }
        } while(resp.data.docs?.length === viewSize);

        // Update the state with the fetched permissions
        this.permissions = serverPermissions;
      } catch (error: any) {
        return Promise.reject(error);
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
        cookieHelper().set("userId", this.current.userId)

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
    setCurrent(current: any) {
      this.current = current
    }
  },
  persist: true
})
