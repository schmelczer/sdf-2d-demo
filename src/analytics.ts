import {
  init as plausibleInit,
  track as plausibleTrack,
  type PlausibleEventOptions,
} from '@plausible-analytics/tracker';

const ANALYTICS_AUTO_CAPTURE_PAGEVIEWS = true;
const ANALYTICS_DOMAIN = 'schmelczer.dev/sdf2d';
const ANALYTICS_ENDPOINT = 'https://stats.schmelczer.dev/status';
const ANALYTICS_LOGGING = process.env.NODE_ENV !== 'production';

let isInitialized = false;

export const track = (
  eventName: string,
  options: PlausibleEventOptions = {}
) => {
  try {
    plausibleTrack(eventName, options);
  } catch (error) {
    console.warn(`Could not track analytics event "${eventName}".`, error);
  }
};

export const initAnalytics = () => {
  if (isInitialized) {
    return;
  }

  try {
    plausibleInit({
      domain: ANALYTICS_DOMAIN,
      endpoint: ANALYTICS_ENDPOINT,
      autoCapturePageviews: ANALYTICS_AUTO_CAPTURE_PAGEVIEWS,
      logging: ANALYTICS_LOGGING,
    });
    isInitialized = true;
  } catch (error) {
    console.warn('Could not initialize analytics.', error);
  }
};
