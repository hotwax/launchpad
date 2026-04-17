import { api, commonUtil, cookieHelper, logger, translate } from "@common";
import { DateTime } from "luxon";
import { computed, ref } from "vue";
import emitter from "@/event-bus";
import { useUserStore } from "@/store/user";
import { showToast } from "@/util";
import router from "@/router";

interface LoginOption {
  loginAuthType?: string,
  maargInstanceUrl?: string,
  loginAuthUrl?: string
}

const tokenRef: any = ref(cookieHelper().get("token"));
const expirationTimeRef: any = ref(cookieHelper().get("expirationTime"));

export function useAuth() {
  const loginOption = ref<LoginOption>({})
  const userStore = useUserStore()

  const updateToken = (token: any, expirationTime: any) => {
    cookieHelper().set("token", token)
    cookieHelper().set("expirationTime", expirationTime)
    tokenRef.value = token;
    expirationTimeRef.value = expirationTime;
  }

  const clearAuth = () => {
    cookieHelper().remove("token");
    cookieHelper().remove("expirationTime");
    cookieHelper().remove("maarg");
    cookieHelper().remove("oms");
    cookieHelper().remove("userId");
    updateToken("", "")
  }

  const isAuthenticated = computed(() => {
    let isTokenExpired = false;
    let isOmsVerified = false;
    let isPartyVerified = false;
    const oms = cookieHelper().get("oms")
    const userId = cookieHelper().get("userId")

    const expiry = Number(expirationTimeRef.value);
    if(expiry) {
      const currTime = DateTime.now().toMillis();
      isTokenExpired = expiry < currTime;
    }

    // Need to set oms in store from the same flow when we are setting it in cookie
    if(oms && userStore.oms === oms) {
      isOmsVerified = true
    }

    if(userId && userStore.current.userId === userId) {
      isPartyVerified = true
    }

    return !isTokenExpired && isOmsVerified && isPartyVerified
  })

  const login = async (username?: string, password?: string, token?: string, expirationTime?: string) => {
    let omsToken = token
    let expiresAt = expirationTime
    try {
      if(!omsToken && username && password) {
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

        omsToken = resp.data.token
        expiresAt = resp.data.expirationTime
      }

      updateToken(omsToken, expiresAt)
      await userStore.fetchUserProfile()
      await userStore.fetchPermissions()
    } catch (err: any) {
      showToast(translate("Something went wrong while login. Please contact administrator."));
      logger.error("error: ", err.toString());

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
        resp = await api({
          url: "logout",
          method: "GET",
          baseURL: commonUtil.getOmsURL()
        });
        resp = JSON.parse(resp.data.startsWith("//") ? resp.data.replace("//", "") : resp.data);
      } catch (err) {
        logger.error("Error logging out", err);
      }

      if(resp?.data?.logoutAuthType == "SAML2SSO") {
        redirectionUrl = resp.data.logoutUrl;
      }
    }

    userStore.$reset();

    // When the oms and party in state does not match the one stored in cookie, invalidAppContext is true
    // and in that case we do not need to clear the token from cookie
    if(!payload?.invalidAppContext) {
      updateToken("", "")
    }

    if(redirectionUrl) {
      window.location.href = redirectionUrl;
    } else {
      router.replace("/login");
    }

    emitter.emit("dismissLoader");

    return redirectionUrl;
  }

  const fetchLoginOptions = async () => {
    loginOption.value = {}
    try {
      const resp = await api({
        url: "checkLoginOptions",
        method: "GET",
        baseURL: commonUtil.getOmsURL()
      });
      if(!commonUtil.hasError(resp)) {
        loginOption.value = resp.data
        cookieHelper().set("maarg", resp.data.maargInstanceUrl)
      }
    } catch (error) {
      logger.error(error)
    }
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
    // Getters
    isAuthenticated
  }
}
