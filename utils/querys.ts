import client from '@/utils/sanity';

export const getOnboardingText = client.fetch(`
*[_type == "onboardingPage"] | order(position asc){
  title,
  paragraph,
  position,
}`);

export const getVersionDescriptions = client.fetch(`
*[_type == "versionDescriptions"] | order(position asc){
  version,
  paragraph,
  position,
}`);