const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs').promises;
const config = require('./config');

class TwitterService {
  constructor() {
    this.client = null;
    this.readWriteClient = null;
  }

  init() {
    try {
      // Validate credentials
      if (!config.twitter.appKey || !config.twitter.appSecret || 
          !config.twitter.accessToken || !config.twitter.accessSecret) {
        throw new Error('Missing Twitter API credentials. Please check your .env file.');
      }

      // Create Twitter client with user context (for posting)
      this.client = new TwitterApi({
        appKey: config.twitter.appKey,
        appSecret: config.twitter.appSecret,
        accessToken: config.twitter.accessToken,
        accessSecret: config.twitter.accessSecret,
      });

      this.readWriteClient = this.client.readWrite;
      console.log('✅ Twitter API client initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Twitter client:', error);
      throw error;
    }
  }

  async postPollWithImage(imageBuffer, pollText, pollOptions) {
    if (!this.readWriteClient) {
      this.init();
    }

    try {
      if (config.bot.dryRun) {
        console.log('🔍 DRY RUN - Would post tweet:');
        console.log('Text:', pollText);
        console.log('Options:', pollOptions);
        return {
          data: {
            id: 'dry_run_' + Date.now(),
            text: pollText,
          },
        };
      }

      // Step 1: Create tweet with poll only (Twitter doesn't allow poll + media in same tweet)
      const pollTweet = await this.readWriteClient.v2.tweet({
        text: pollText,
        poll: {
          options: pollOptions,
          duration_minutes: config.bot.pollDurationMinutes,
        },
      });

      console.log('✅ Poll tweet posted:', pollTweet.data.id);

      // Step 2: Upload image
      const mediaId = await this.readWriteClient.v1.uploadMedia(imageBuffer, {
        mimeType: 'image/png',
      });

      // Step 3: Reply to poll tweet with chart image
      const imageReply = await this.readWriteClient.v2.tweet({
        text: `📊 Here's the chart:\n\n🎮 Try it yourself: ${config.referralLink}`,
        reply: {
          in_reply_to_tweet_id: pollTweet.data.id,
        },
        media: {
          media_ids: [mediaId],
        },
      });

      console.log('✅ Chart image posted as reply:', imageReply.data.id);
      
      return pollTweet;
    } catch (error) {
      console.error('❌ Failed to post tweet:', error);
      throw error;
    }
  }

  async replyToTweet(tweetId, replyText) {
    if (!this.readWriteClient) {
      this.init();
    }

    try {
      if (config.bot.dryRun) {
        console.log('🔍 DRY RUN - Would reply to tweet:', tweetId);
        console.log('Reply:', replyText);
        return {
          data: {
            id: 'dry_run_reply_' + Date.now(),
            text: replyText,
          },
        };
      }

      const reply = await this.readWriteClient.v2.tweet({
        text: replyText,
        reply: {
          in_reply_to_tweet_id: tweetId,
        },
      });

      console.log('✅ Reply posted:', reply.data.id);
      return reply;
    } catch (error) {
      console.error('❌ Failed to post reply:', error);
      throw error;
    }
  }

  getRandomTemplate(templates) {
    return templates[Math.floor(Math.random() * templates.length)];
  }

  generatePollText() {
    const baseText = this.getRandomTemplate(config.messages.poll.templates);
    const aggroTag = this.getRandomTemplate(config.messages.poll.aggroTags);
    return `${baseText} ${aggroTag}`;
  }

  generateResultText(direction, percentChange) {
    const absPercent = Math.abs(percentChange).toFixed(2);
    
    let templates;
    if (Math.abs(percentChange) < 0.5) {
      templates = config.messages.results.sideways;
    } else if (direction === 'long') {
      templates = config.messages.results.long_win;
    } else {
      templates = config.messages.results.short_win;
    }

    const template = this.getRandomTemplate(templates);
    return template
      .replace('{percent}', absPercent)
      .replace('{referral}', config.referralLink);
  }
}

module.exports = new TwitterService();
