import { autoReleaseDue } from '../modules/tasks/tasks.service.js';

// Every 10 minutes: tasks the customer never confirmed or disputed within AUTO_RELEASE_HOURS are released.
export function startJobs() {
  const run = () => autoReleaseDue().then((n) => n && console.log(`⏱  auto-released ${n} task(s)`)).catch((e) => console.error('autoRelease job failed', e.message));
  setTimeout(run, 15_000);
  return setInterval(run, 10 * 60 * 1000);
}
