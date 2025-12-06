const fs = require('fs').promises;
const path = require('path');
const config = require('./config');

class Storage {
  constructor() {
    this.pollsFile = path.resolve(config.paths.pollsData);
    this.polls = [];
  }

  async init() {
    try {
      await fs.access(this.pollsFile);
      const data = await fs.readFile(this.pollsFile, 'utf8');
      this.polls = JSON.parse(data);
    } catch (error) {
      // File doesn't exist, create it
      await this.save();
    }
  }

  async save() {
    await fs.writeFile(this.pollsFile, JSON.stringify(this.polls, null, 2));
  }

  async addPoll(pollData) {
    this.polls.push({
      ...pollData,
      createdAt: new Date().toISOString(),
      status: 'pending', // pending, completed
    });
    await this.save();
    return this.polls[this.polls.length - 1];
  }

  async getPendingPolls() {
    return this.polls.filter(poll => poll.status === 'pending');
  }

  async updatePollStatus(tweetId, status, resultData = {}) {
    const poll = this.polls.find(p => p.tweetId === tweetId);
    if (poll) {
      poll.status = status;
      poll.resultData = resultData;
      poll.completedAt = new Date().toISOString();
      await this.save();
    }
    return poll;
  }

  async getPollByTweetId(tweetId) {
    return this.polls.find(p => p.tweetId === tweetId);
  }

  async cleanupOldPolls(daysOld = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const initialLength = this.polls.length;
    this.polls = this.polls.filter(poll => {
      const pollDate = new Date(poll.createdAt);
      return pollDate > cutoffDate;
    });
    
    if (this.polls.length < initialLength) {
      await this.save();
      return initialLength - this.polls.length;
    }
    return 0;
  }
}

module.exports = new Storage();
