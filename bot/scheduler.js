const cron = require('node-cron');
const config = require('./config');

class Scheduler {
  constructor() {
    this.jobs = [];
    this.followUpJobs = new Map(); // tweetId -> timeout
  }

  scheduleMainJob(callback) {
    // Schedule every N hours
    const hours = config.bot.scheduleHours;
    const cronExpression = `0 */${hours} * * *`; // Every N hours at minute 0
    
    console.log(`📅 Scheduling main job: every ${hours} hours`);
    
    const job = cron.schedule(cronExpression, async () => {
      console.log('⏰ Scheduled job triggered');
      try {
        await callback();
      } catch (error) {
        console.error('❌ Scheduled job failed:', error);
      }
    }, {
      scheduled: true,
      timezone: 'UTC',
    });

    this.jobs.push(job);
    return job;
  }

  scheduleFollowUp(tweetId, callback, delayMinutes = null) {
    const delay = (delayMinutes || config.bot.pollDurationMinutes) * 60 * 1000;
    
    console.log(`⏱️  Scheduling follow-up for tweet ${tweetId} in ${delayMinutes || config.bot.pollDurationMinutes} minutes`);
    
    const timeout = setTimeout(async () => {
      console.log(`⏰ Follow-up triggered for tweet ${tweetId}`);
      try {
        await callback(tweetId);
        this.followUpJobs.delete(tweetId);
      } catch (error) {
        console.error(`❌ Follow-up failed for tweet ${tweetId}:`, error);
      }
    }, delay);

    this.followUpJobs.set(tweetId, timeout);
    return timeout;
  }

  cancelFollowUp(tweetId) {
    const timeout = this.followUpJobs.get(tweetId);
    if (timeout) {
      clearTimeout(timeout);
      this.followUpJobs.delete(tweetId);
      console.log(`❌ Cancelled follow-up for tweet ${tweetId}`);
      return true;
    }
    return false;
  }

  stopAll() {
    // Stop cron jobs
    this.jobs.forEach(job => job.stop());
    this.jobs = [];
    
    // Clear all follow-up timeouts
    this.followUpJobs.forEach((timeout, tweetId) => {
      clearTimeout(timeout);
    });
    this.followUpJobs.clear();
    
    console.log('🛑 All scheduled jobs stopped');
  }

  start() {
    this.jobs.forEach(job => job.start());
    console.log('▶️  Scheduler started');
  }
}

module.exports = new Scheduler();
