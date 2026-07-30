import { api, client, hasError } from '@/adapter';
import { useAuthStore } from '@/store/auth';

const login = async (username: string, password: string): Promise<any> => {
  const authStore = useAuthStore()
  return authStore.isMoquiOnly ? client({
    url: "admin/login",
    method: "post",
    data: {
      "username": username,
      "password": password
    },
    baseURL: authStore.getBaseUrl
  }) : api({
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
      url: authStore.isMoquiOnly ? "admin/user/profile" : "user-profile",
      method: "get",
      baseURL,
      headers: {
        Authorization:  'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    });
    if (hasError(resp)) return Promise.reject("Error getting user profile: " + JSON.stringify(resp.data));
    return Promise.resolve(authStore.isMoquiOnly ? {
      email: resp.data.emailAddress,
      partyId: resp.data.userId,
      partyName: resp.data.userFullName,
      userLocale: resp.data.locale,
      userLoginId: resp.data.username,
      userTimeZone: resp.data.timeZone
    } : resp.data)
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

const getUserPermissions = async (payload: any, token: any): Promise<any> => {
  const authStore = useAuthStore()
  const baseURL = authStore.getBaseUrl
  let serverPermissions = [] as any;

  // If the server specific permission list doesn't exist, getting server permissions will be of no use
  // It means there are no rules yet depending upon the server permissions.
  if (payload.permissionIds && payload.permissionIds.length == 0) return serverPermissions;
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
        permissionIds: payload.permissionIds
      }

      const dataPayload: any = authStore.isMoquiOnly ? { params } : { data: params }

      resp = await client({
        url: authStore.isMoquiOnly ? "admin/user/permissions" : "getPermissions",
        method: authStore.isMoquiOnly ? "get" : "post",
        baseURL,
        headers: {
          Authorization:  'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        ...dataPayload
      })
      if(resp.status === 200 && resp.data.docs?.length && !hasError(resp)) {
        serverPermissions = resp.data.docs.map((permission: any) => permission.permissionId);
        const total = resp.data.count;
        const remainingPermissions = total - serverPermissions.length;
        if (remainingPermissions > 0) {
          // We need to get all the remaining permissions
          const apiCallsNeeded = Math.floor(remainingPermissions / viewSize) + ( remainingPermissions % viewSize != 0 ? 1 : 0);
          const responses = await Promise.all([...Array(apiCallsNeeded).keys()].map(async (index: any) => {
            if(authStore.isMoquiOnly) {
              dataPayload["params"]["viewIndex"] = index + 1
            }

            const response = await client({
              url: authStore.isMoquiOnly ? "admin/user/permissions" : "getPermissions",
              method: authStore.isMoquiOnly ? "get" : "post",
              baseURL,
              headers: {
                Authorization:  'Bearer ' + token,
                'Content-Type': 'application/json'
              },
              ...dataPayload
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
      return serverPermissions;
    } catch(error: any) {
      return Promise.reject(error);
    }
}

export const UserService = {
  getUserProfile,
  checkLoginOptions,
  login,
  getUserPermissions
}