## Do this

- Wisdom Tree!
- Show paginated notes for situations
- Unlock for various terrains have icons. Add iconUrl to terrain and show it in unlock menu.
  - Use this icon in Locations page.
- Pinning for items in search dialog.
- Recipe selector for freeform situation orchestrations. See the ambit properties.
- Allow master book recipe execution to be ok with not-quite-as-many-aspects recipe.
- use situation.thresholdContents in SituationModel.thresholdContents$
- Investigate why multithreaded reads in SHRestAPI cause state corruptions
  - Iterators invalidated. GetAspectsInContext?
  - Permenant state corruption from a null aspect name?
  - Everything was fine before we added situation.canExecute
- Orchestrations asynchronously close their situation on destroy, but a new orchestration might already have
  claimed that situation and is trying to use it.
  - Situations should have a task queue so they dont try to close and open simultaniously.

## Maybe

- Prompt / toast the user for empty slots or new notes in recipes after time skip.
- Flip over element stacks. Before using them? Automatically on finding them?
  - Recipe executor can make use of flipped over cards, confusing the game
