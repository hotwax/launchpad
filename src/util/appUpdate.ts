// index.html is served with `Cache-Control: no-cache`, so any reload picks up the latest
// build. Tabs that stay open for days never reload though, so check index.html for a newer
// deploy whenever the user comes back to the tab and refresh once one is available. The
// bundle name of the entry script (its content hash changes on every build) identifies the
// build the tab is running.

const APP_SCRIPT_PATTERN = /js\/app\.[a-z0-9]+\.js/i;
// Returning to the tab repeatedly should not mean a request per switch
const MIN_CHECK_GAP = 5 * 60 * 1000;

let runningBuild = '' as string;
let lastCheckedAt = 0;
let reloading = false;

const getRunningBuild = () => {
  const sources = Array.from(document.querySelectorAll('script[src]'))
    .map((script) => script.getAttribute('src') || '');
  return sources.map((src) => APP_SCRIPT_PATTERN.exec(src)?.[0]).find((match) => match) || '';
}

const getDeployedBuild = async () => {
  try {
    const response = await fetch(`${process.env.BASE_URL || '/'}index.html`, { cache: 'no-store' });
    if (!response.ok) return '';
    return APP_SCRIPT_PATTERN.exec(await response.text())?.[0] || '';
  } catch (error) {
    // Offline or request failed, the next check will try again
    return '';
  }
}

const checkForUpdate = async () => {
  if (reloading || document.visibilityState !== 'visible') return;
  if (Date.now() - lastCheckedAt < MIN_CHECK_GAP) return;
  lastCheckedAt = Date.now();

  const deployedBuild = await getDeployedBuild();
  if (!deployedBuild || deployedBuild === runningBuild) return;

  reloading = true;
  window.location.reload();
}

export const watchForAppUpdate = () => {
  runningBuild = getRunningBuild();
  // Without a build to compare against we would reload on every check
  if (!runningBuild) return;

  // visibilitychange covers switching tabs, focus covers switching windows or apps
  document.addEventListener('visibilitychange', checkForUpdate);
  window.addEventListener('focus', checkForUpdate);
}
