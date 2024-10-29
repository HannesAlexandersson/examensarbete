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

export const getAccountVersion = (userSelectedVersion: string) => client.fetch(
  `*[_type == "account" && version == $userSelectedVersion] | order(position asc){
    version,
    welcomeText,
    questionButtonText,
    diaryButtonText,
    questionText
  }`,
  { userSelectedVersion }
);