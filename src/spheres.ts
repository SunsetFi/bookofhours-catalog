export const portageSpherePaths = [
  "~/portage1",
  "~/portage2",
  "~/portage3",
  "~/portage4",
  "~/portage5",
];

// FIXME: We might be missing something.  Maybe enroute isnt what I think it is.
// Rapidly changing orchestration recipes and having cards fly back and forth ends up
// thinking cards have retired when they havent.
export const alwaysVisibleSpherePaths = [
  ...portageSpherePaths,
  "~/hand.abilities",
  "~/hand.skills",
  "~/hand.memories",
  "~/hand.misc",
  "~/fixedverbs",
  "~/arrivalverbs",
  "~/wisdomtreenodes",
  // Note: The REST API tries really hard to not return to us until all tokens are settled,
  // but some instantanious updates are capturing cards when they are enroute.
  // We are choosing to display these so that the cards dont temporarily go missing, but such cards
  // are not in the exterior sphere and thus cannot be interacted with.
  "~/enroute",
];

export const allSpherePaths = [...alwaysVisibleSpherePaths, "~/library"];

export const brancrugTokens = [
  "~/library!brancrugbeach",
  "~/library!brancrug",
  "~/library!ocean",
];
