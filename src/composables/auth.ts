import { api, client, commonUtil, cookieHelper, isMoquiOmsRef, logger, translate, useAuth as useCommonAuth } from "@common";
import { DateTime } from "luxon";
import { computed, ref } from "vue";
import emitter from "@/event-bus";
import { useUserStore } from "@/store/user";
import { normalizeOms, showToast } from "@/util";

interface LoginOption {
  loginAuthType?: string,
  maargInstanceUrl?: string,
  loginAuthUrl?: string
}

const tokenRef: any = ref(cookieHelper().get("token"));
const expirationTimeRef: any = ref(cookieHelper().get("expirationTime"));
const omsRef: any = ref(cookieHelper().get("oms"));
const userIdRef: any = ref(cookieHelper().get("userId"));

export function useAuth() {
  const loginOption = ref<LoginOption>({})
  const userStore = useUserStore()

  // Seconds until the token expires, as the framework's useAuth does: without it the cookies get
  // cookieHelper's one day default and the session ends then even while the token is still valid
  const getDuration = (expirationTime?: any) => {
    const expiry = expirationTime !== undefined && expirationTime !== null ? expirationTime : cookieHelper().get("expirationTime")
    return expiry ? Math.floor(DateTime.fromMillis(Number(expiry)).diffNow().as("seconds")) : undefined
  }

  const updateToken = (token: any, expirationTime: any) => {
    const duration = getDuration(expirationTime)
    cookieHelper().set("token", token, duration)
    cookieHelper().set("expirationTime", expirationTime, duration)
    // The rest of the session lives as long as the token
    for(const name of ["oms", "maarg", "userId"]) {
      const value = cookieHelper().get(name)
      if(value) cookieHelper().set(name, value, duration)
    }
    tokenRef.value = token;
    expirationTimeRef.value = expirationTime;
  }

  const updateOMS = (oms: any) => {
    cookieHelper().set("oms", oms, getDuration())
    omsRef.value = oms;
  }

  const updateUserId = (userId: any) => {
    cookieHelper().set("userId", userId, getDuration())
    userIdRef.value = userId;
  }

  const clearAuth = () => {
    cookieHelper().remove("token");
    cookieHelper().remove("expirationTime");
    cookieHelper().remove("maarg");
    cookieHelper().remove("oms");
    cookieHelper().remove("userId");
    updateToken("", "")
    updateOMS("")
    updateUserId("")
  }

  const isAuthenticated = computed(() => {
    let isTokenExpired = false;
    let isOmsVerified = false;
    let isUserVerified = false;

    const expiry = Number(expirationTimeRef.value);
    if(expiry) {
      const currTime = DateTime.now().toMillis();
      isTokenExpired = expiry < currTime;
    }

    // The cookies catch a change from another tab; reading the refs as well makes this recompute
    // when this tab updates them, since cookies are not reactive
    const oms = omsRef.value !== undefined && cookieHelper().get("oms")
    const userId = userIdRef.value !== undefined && cookieHelper().get("userId")
    // Need to set oms in store from the same flow when we are setting it in cookie. An app the user opened
    // may have saved the same OMS with its API path, which is still this session
    if(oms && normalizeOms(userStore.oms) === normalizeOms(oms)) {
      isOmsVerified = true
    }

    if(userId && userStore.current.userId === userId) {
      isUserVerified = true
    }

    return !isTokenExpired && isOmsVerified && isUserVerified
  })

  const login = async (username?: string, password?: string, token?: string, expirationTime?: string) => {
    let omsToken = token
    let expiresAt = expirationTime
    // OFBiz warns through the login response, e.g. a password about to expire
    let loginAlert = ""
    try {
      if(!omsToken && username && password) {
        // A Moqui-only OMS is its own maarg instance, see fetchLoginOptions
        const resp = await api(userStore.isMoquiOnly ? {
          url: "admin/login",
          method: "post",
          data: {
            "username": username,
            "password": password
          },
          baseURL: commonUtil.getMaargURL()
        } : {
          url: "login",
          method: "post",
          data: {
            "USERNAME": username,
            "PASSWORD": password
          },
          baseURL: commonUtil.getOmsURL(false)
        });
        if(commonUtil.hasError(resp)) {
          showToast(translate("Sorry, your username or password is incorrect. Please try again."));
          logger.error(`User [Context: authentication] - Request failed: ${resp.data._ERROR_MESSAGE_}`);
          updateUserId("")
          updateToken("", "")

          return Promise.reject(new Error(resp.data._ERROR_MESSAGE_));
        }

        omsToken = resp.data.token
        expiresAt = resp.data.expirationTime
        if(resp.data._EVENT_MESSAGE_?.startsWith("Alert:")) {
          loginAlert = resp.data._EVENT_MESSAGE_
        }
      }

      updateToken(omsToken, expiresAt)
      // The session belongs to the OMS in the cookie; the store may not have it, e.g. after logout reset
      // it and Login went straight to the credentials step, and isAuthenticated compares the two
      userStore.oms = cookieHelper().get("oms") || ""
      try {
        await userStore.fetchUserProfile()
      } catch (err) {
        clearAuth()
        throw err
      }
      updateUserId(userStore.current.userId)
      await userStore.fetchPermissions()

      // Shown once the login has fully succeeded, as main did
      if(loginAlert) {
        showToast(translate(loginAlert))
      }
    } catch (err: any) {
      showToast(translate("Something went wrong while login. Please contact administrator."));
      logger.error(`User [Context: authentication] - Request failed: ${err.toString()}`);

      return Promise.reject(err instanceof Object ? err : new Error(err));
    }
  }

  const logout = async (payload?: any) => {
    let redirectionUrl = "";

    if(!payload?.isUserUnauthorised) {
      emitter.emit("presentLoader", {
        message: "Logging out",
        backdropDismiss: false,
      });

      let resp;
      try {
        resp = await api(userStore.isMoquiOnly ? {
          url: "admin/logout",
          method: "POST",
          baseURL: commonUtil.getMaargURL()
        } : {
          url: "logout",
          method: "GET",
          baseURL: commonUtil.getOmsURL(false)
        }) as any;
        // OFBiz prefixes its JSON with "//", so axios leaves it as text; Maarg's arrives parsed
        resp = typeof resp.data === "string" ? JSON.parse(resp.data.startsWith("//") ? resp.data.replace("//", "") : resp.data) : resp.data;
      } catch (err) {
        logger.error("User - Failed to log out", err);
      }

      if(resp?.logoutAuthType == "SAML2SSO") {
        redirectionUrl = resp.logoutUrl;
      }
    }

    // resetting the whole state except oms, which stays in the cookie for the next login
    // $patch, not an assignment: right after $reset Pinia does not notify subscribers of direct
    // changes in the same tick, so the persisted state would keep the reset value
    const oms = userStore.oms
    userStore.$reset();
    userStore.$patch({ oms })
    updateUserId("")

    // When the oms and party in state does not match the one stored in cookie, invalidAppContext is true
    // and in that case we do not need to clear the token from cookie
    if(!payload?.invalidAppContext) {
      updateToken("", "")
    }

    // The user stays on the page they logged out from, Home shows the logged out state
    if(redirectionUrl) {
      window.location.href = redirectionUrl;
    }

    emitter.emit("dismissLoader");

    return redirectionUrl;
  }

  // The framework's check tries the OMS as OFBiz first and falls back to Moqui's admin/checkLoginOptions,
  // setting the maarg cookie for both (a Moqui-only OMS is its own maarg). Its isMoquiOmsRef is not kept
  // across reloads, so the answer is kept in the persisted user store for login, permissions, logout and app links.
  const fetchLoginOptions = async () => {
    const commonAuth = useCommonAuth()
    const isOmsReachable = await commonAuth.fetchLoginOptions()
    loginOption.value = { ...commonAuth.loginOption.value }
    userStore.isMoquiOnly = isMoquiOmsRef.value

    return isOmsReachable
  };

  // The emailed reset link carries no session, so this goes through the unauthenticated `client`
  // against the instance the link names instead of `api()`
  const resetPassword = async (baseURL: string, userId: string, payload: any) => {
    return client({
      baseURL,
      url: `admin/users/${userId}/changePassword`,
      method: "post",
      data: payload
    });
  };

  return {
    // Variables
    loginOption,
    // Functions
    fetchLoginOptions,
    login,
    logout,
    clearAuth,
    updateToken,
    updateOMS,
    updateUserId,
    resetPassword,
    // Getters
    isAuthenticated
  }
}
