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

// Discovery is public. Resolve the partner from this OMS before sending it the session token.
const getPairedMaarg = async (baseURL: string): Promise<string> => {
  const url = new URL('checkLoginOptions', baseURL.replace(/\/?$/, '/'));
  const response = await fetch(url.toString(), { credentials: 'omit', redirect: 'error' });
  if (!response.ok) return '';
  // OFBiz may prefix JSON returned from a GET with two slashes.
  const options = JSON.parse((await response.text()).replace(/^\/\//, ''));
  return options?.loginAuthType && typeof options.maargInstanceUrl === 'string' ? options.maargInstanceUrl : '';
}

// Keep a secondary API failure isolated from the primary client's session interceptors.
const getPairedPermissions = async (permissionIds: string[], token: string, baseURL: string): Promise<string[]> => {
  if (!permissionIds.length) return [];
  const url = new URL('admin/user/permissions', baseURL);
  permissionIds.forEach(id => url.searchParams.append('permissionIds', id));
  // Each ID can occur only once in Maarg's distinct permission result.
  url.searchParams.set('viewSize', String(permissionIds.length));
  const response = await fetch(url.toString(), {
    credentials: 'omit',
    redirect: 'error',
    headers: { Authorization: 'Bearer ' + token }
  });
  if (!response.ok) throw new Error("Failed to fetch paired application permissions");
  const data = await response.json();
  if (!Array.isArray(data?.docs)) throw new Error("Invalid paired application permissions");
  return data.docs.map((doc: { permissionId: string }) => doc.permissionId).filter((id: string) => permissionIds.includes(id));
}

const getUserPermissions = async (permissionIds: string[], token: string, baseURL: string, isMoqui: boolean): Promise<string[]> => {
  if (!permissionIds.length) return [];

  const permissions = new Set<string>();
  const viewSize = 200;
  let viewIndex = 0;
  let hasMore;
  do {
    const params = { permissionIds, viewSize, viewIndex };
    const response = await client({
      baseURL,
      url: isMoqui ? "admin/user/permissions" : "getPermissions",
      method: isMoqui ? "get" : "post",
      headers: { Authorization: 'Bearer ' + token },
      ...(isMoqui ? { params } : { data: params })
    });
    if (!isMoqui && response.status === 200 && response.data?.error === 'No record found') break;
    if (response.status !== 200 || hasError(response) || !Array.isArray(response.data?.docs)) {
      throw new Error("Failed to fetch application permissions");
    }
    const docs = response.data.docs as { permissionId: string }[];
    for (const { permissionId } of docs) {
      if (permissionIds.includes(permissionId)) permissions.add(permissionId);
    }
    viewIndex++;
    // Maarg's count covers the current page, while OFBiz returns a total.
    const possibleCount = isMoqui ? permissionIds.length : Number(response.data.count);
    hasMore = docs.length > 0 && viewIndex * viewSize < possibleCount;
  } while (hasMore);
  return Array.from(permissions);
}

export const UserService = {
  getUserProfile,
  checkLoginOptions,
  getPairedMaarg,
  getPairedPermissions,
  login,
  getUserPermissions
}
