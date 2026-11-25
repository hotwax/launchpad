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

// A missing route, network failure or server outage can use the legacy OFBiz lookup.
const readMaargService = async (url: URL, token?: string) => {
  const response = await fetch(url.toString(), {
    credentials: 'omit', redirect: 'error',
    headers: token ? { Authorization: 'Bearer ' + token } : {}
  }).catch(() => null);
  if (!response || response.status === 404 || response.status >= 500) return null;
  if (!response.ok) throw new Error(`Permission lookup failed (HTTP ${response.status})`);
  return response;
}

const getUserPermissions = async (permissionIds: string[], token: string): Promise<string[]> => {
  if (!permissionIds.length) return [];
  const { getBaseUrl: baseURL, isMoquiOnly } = useAuthStore();
  let maarg = baseURL;

  if (!isMoquiOnly) {
    const discovery = await readMaargService(new URL('checkLoginOptions', baseURL.replace(/\/?$/, '/')));
    // OFBiz can prefix a GET response with two slashes.
    maarg = discovery && JSON.parse((await discovery.text()).replace(/^\/\//, '')).maargInstanceUrl;
  }

  if (maarg) {
    const url = new URL(maarg.startsWith('http') ? maarg : `https://${maarg}.hotwax.io`);
    url.pathname = url.pathname.replace(/(?:\/rest\/s1)?\/?$/, '/rest/s1/admin/user/permissions');
    permissionIds.forEach(id => url.searchParams.append('permissionIds', id));
    url.searchParams.set('viewSize', String(permissionIds.length));
    const response = await readMaargService(url, token);
    if (response) {
      const { docs } = await response.json();
      return docs.map((doc: { permissionId: string }) => doc.permissionId).filter((id: string) => permissionIds.includes(id));
    }
  }
  if (isMoquiOnly) throw new Error('Maarg permissions are unavailable');

  const grants: string[] = [];
  // OFBiz limits page size. Each requested ID can match at most one distinct grant.
  for (let start = 0; start < permissionIds.length; start += 200) {
    const ids = permissionIds.slice(start, start + 200);
    const url = new URL('getPermissions', baseURL.replace(/\/?$/, '/'));
    const response = await fetch(url.toString(), {
      method: 'POST', credentials: 'omit', redirect: 'error',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissionIds: ids, viewIndex: 0, viewSize: ids.length })
    });
    if (!response.ok) throw new Error('OFBiz permissions are unavailable');
    const data = JSON.parse((await response.text()).replace(/^\/\//, ''));
    if (data.error === 'No record found') continue;
    for (const { permissionId } of data.docs) {
      if (ids.includes(permissionId)) grants.push(permissionId);
    }
  }
  return grants;
}

export const UserService = {
  getUserProfile,
  checkLoginOptions,
  login,
  getUserPermissions
}