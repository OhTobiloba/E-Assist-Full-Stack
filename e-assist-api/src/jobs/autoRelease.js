import { autoReleaseDue } from '../modules/tasks/tasks.service.js';

// Every 10 minutes: tasks the customer never confirmed or disputed within AUTO_RELEASE_HOURS are released.
// export function startJobs() {
//   const run = () => autoReleaseDue().then((n) => n && console.log(`⏱  auto-released ${n} task(s)`)).catch((e) => console.error('autoRelease job failed', e));
//   setTimeout(run, 15_000);
//   return setInterval(run, 10 * 60 * 1000);
// }



// import { autoReleaseDue } from '../modules/tasks/tasks.service.js';

export function startJobs() {
  let running = false;

  const run = async () => {
    if (running) {
      console.log('⏳ Auto-release skipped: previous run still active');
      return;
    }

    running = true;

    try {
      const n = await autoReleaseDue();
      if (n) console.log(`⏱ auto-released ${n} task(s)`);
      else console.log('Auto-release check completed: no due tasks');
    } catch (error) {
      console.error('autoRelease job failed:', error);
    } finally {
      running = false;
    }
  };

  setTimeout(run, 15_000);
  return setInterval(run, 2 * 60 * 1000);
}
