import { api, commonUtil, cookieHelper, logger, translate } from "@common";
import { DateTime } from "luxon";
import { computed, ref } from "vue";
import { resetPermissions } from "@/authorization";
import emitter from "@/event-bus";
import { useUserStore } from "@/store/user";
import { showToast } from "@/util";

interface LoginOption {
  loginAuthType?: string,
  maargInstanceUrl?: string,
  loginAuthUrl?: string
}

const token = ref(cookieHelper().get("token"));
const expirationTime = ref(cookieHelper().get("expirationTime"));

export function useAuth() {
  const loginOption = ref<LoginOption>({})
  const userStore = useUserStore()

  const clearAuth = () => {
    cookieHelper().remove("token");
    cookieHelper().remove("expirationTime");
    cookieHelper().remove("maarg");
    cookieHelper().remove("oms");
    token.value = null;
    expirationTime.value = null;
  }

  const isAuthenticated = computed(() => {
    let isTokenExpired = false;
    const expiry = Number(expirationTime.value);
    if(expiry) {
      const currTime = DateTime.now().toMillis();
      isTokenExpired = expiry < currTime;
    }

    const isAuth = !!(token.value && !isTokenExpired)
    if(!isAuth) {
      clearAuth();
    }

    return isAuth;
  })

  const login = async (username: string, password: string) => {
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

      cookieHelper().set("token", resp.data.token)
      cookieHelper().set("expirationTime", resp.data.expirationTime)
      token.value = resp.data.token;
      expirationTime.value = resp.data.expirationTime;

      await userStore.fetchPermissions()

      // Handling case for warnings like password may expire in few days
      if(resp.data._EVENT_MESSAGE_ && resp.data._EVENT_MESSAGE_.startsWith("Alert:")) {
        showToast(translate(resp.data._EVENT_MESSAGE_));
      }
    } catch (err: any) {
      showToast(translate("Something went wrong while login. Please contact administrator."));
      logger.error("error: ", err.toString());

      return Promise.reject(err instanceof Object ? err : new Error(err));
    }
  }

  const logout = async (payload?: any) => {
    let redirectionUrl = "";
    emitter.emit("presentLoader", {
      message: "Logging out",
      backdropDismiss: false,
    });

    if(!payload?.isUserUnauthorised) {
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
    resetPermissions();
    cookieHelper().remove("token");
    cookieHelper().remove("expirationTime");
    token.value = null;
    expirationTime.value = null;

    if(redirectionUrl) {
      window.location.href = redirectionUrl;
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
    // Getters
    isAuthenticated
  }
}
