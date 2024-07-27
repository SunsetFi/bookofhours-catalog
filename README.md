# Hush House Catalogue

This is a spoiler-free, automatically populating webapp that adds searching, sorting, and filtering capabilities to [Book of Hours](https://store.steampowered.com/app/1028310/BOOK_OF_HOURS/). It connects directly to the game, allowing it to always be fully up to date as gameplay progresses, and providing the ability to interact with the game itself.

![Hush House Catalogue](/preview/preview.png)

It has been designed to provide an automatic spreadsheet, akin to those we might make manually while playing the game. It can additionally interact with the game engine itself, to queue up recipes or focus the camera on in-game items.

All information given is restricted to information you would have had already. This is done by only showing recipes you have discovered, items in rooms that are unlocked, cards that you currently have, and other similar restrictions.

Additionally, it can interact with the game and perform various actions:

- Focus the camera on specific items
- Start, use, and conclude recipes using workstations and other verbs
- Fast forward time to specific events, such as recipe completions or the next day.

A significant focus is being put on screen reader compatibility, with the ultimate goal of providing enough control over the game for an entirely screen reader assisted playthrough of the game. To this end, this project has ambitions to be an entire new UI into all aspects of the game. For more information, see [Accessibility and Screen Reader Support](#accessibility--screen-reader-support).

## Demos

### Unlocking skills and crafting recipes

[https://youtu.be/CPCxDRMBN-E](https://youtu.be/CPCxDRMBN-E)

### Starting the game

[https://youtu.be/hzrwvGxUAKM](https://youtu.be/hzrwvGxUAKM)

## Installation

This project provides two zip files depending on your situation:

- If you have already installed BepInEx:
  - Download `Hush.House.Catalogue.BepInEx.Plugin.zip` from the [Releases](https://github.com/SunsetFi/bookofhours-catalog/releases) page.
  - Copy the contents of the zip file into `steamapps/common/Book of Hours/BepInEx/plugins`
- If you have never installed BepInEx:
  - Download `Hush.House.Catalogue.Quickstart.zip` from the [Releases](https://github.com/SunsetFi/bookofhours-catalog/releases) page.
  - Copy the contents of the zip file into the `steamapps/common/Book of Hours` root directory.
    - This should result in a BepInEx folder and a `winhttp.dll` file in your Book of Hours directory.
    - You should NOT see a folder called "Hush.House.Catalogue.Quickstart" in your Book of Hours directory. Some zip tools will create this folder when extracting the zip. If you see this, copy the contents of that folder back into your Book of Hours folder, and delete the "Hush.House.Catalogue.Quickstart" folder afterwards.

## Usage

This project is best used in the browser of your choice while the game runs in windowed mode. However, the website can also be accessed from the Steam Overlay if you prefer to run the game in fullscreen.

Regardless of the method you use, once the game is running, the interface will be available in your browser at http://localhost:8081/catalogue.

### Interactivity Features

By default, the Catalogue will run in a read-only mode. This lets it act as a reference without actually having any effect on the operations of the game.

However, the Catalogue also has features that allow you interact with the game through the Catalogue itself, from directly executing recipes to fast forwarding time to specific events.

To enable these features, click the `Settings` option under the menu, which is accessible at the top left of the page when a save is loaded.

When enababled, there are two options for how much interactivity to provide:

- Minimal mode lets you control verbs and workstations and start recipes through the Activites Panel, but provides no help in doing so. To run a recipe, you need to choose the workstation and cards to do so.
- Full mode adds automatic recipe execution for things like reading books and crafting items from skills. With this mode, the Catalogue provides the option of automatically choosing an appropriate workstation and slotting the appropriate cards for crafting the recipe. It should be noted that the only crafting recipes it will let you autocomplete are the recipes you have already discovered and unlocked on your own.

## Support

If you are having issues getting this mod to work, support is offered in two places:

- In the [Github Issues](https://github.com/SunsetFi/bookofhours-catalog/issues) page for this project.
- In the [Cultist Simulator fan discord](https://discord.gg/KxyFTZkUbQ), by pinging me (SunsetFi) in the #mod-development channel.

In order to diagnose issues, I will need the `Player.log` log file from your game. On Windows, this is found at `C:\Users\<username>\AppData\LocalLow\Weather Factory\Book of Hours\Player.log`

## Features

This mod provides a sortable, filterable interface for various items in the game. Where possible, it also provides a button to zoom the camera in on the item in question.

### Item tracking

Various pages are provided to track, locate, filter, and sort the various contents of the house.

### Time tracking

The header always shows how many days are left in the season, and how many seconds are left in the day. Additionally, it shows a breakdown of all executing recipes
and how long they have left on their current cycle. It also provides the options to 'fast forward' the game to the completion of any executing recipe, and to the next day.

### Activities and Orchestration

The catalogue provides an interface for executing recipes and tracking ongoing executions in various verbs and workstations through the house. This can be done ad-hoc where the specific recipe is not known, or known recipes can be targeted for automatic filtering of available cards by relevancy.

Primarily, the latter can be used on the books page to master or re-read a book, and the crafting page to craft a specific item.

#### Activities Panel

The activities panel is opened by clicking the icon that takes the appearance of a play arrow inscribed in a circle, which is located at the top right of the website. It may also be opened automatically when you use any of the various "execute recipe" buttons across several pages.

The Activities Panel will stay open as you navigate the various pages of the catalogue, allowing you to reference any information you want while planning your next recipe.

The activities panel will list several items:

- Seconds until the next day, and a button to skip to the next day
- The 'Consider' verb (always shown, even if idle)
- The 'Talk' verb (always shown, even if idle)
- A 'Start an Activity' option, for starting any unlocked verb
- A list of all currently running or completed verbs.

Of the verbs listed, clicking on it will open more details about it in the panel. For verbs that are running, clicking the button on the right will either fast-forward the time remaining on the verb's timer, or will conclude and empty the verb if it is fully completed. You may also shift+click anywhere on the item as a shortcut to using the button.

Any listed verb that is currently active will show its current recipe name underneath the verb name, and show how many seconds remaing until its recipe is completed.

Any listed verb that has completed will indicate how many cards it contains.

#### Recipe execution

Recipes can be prepared and ran in multiple ways:

- By clicking 'Consider', 'Talk' or 'Start an Activity' in the Activities Panel
- Through dragging and dropping a card onto the Consider or Talk items in the Activities Panel
- Through various 'Execute Recipe' buttons found on some pages of the catalogue, such as for mastering a book or crafting an item from a skill.

However way you trigger it, the Activies Panel will expand and show an interface for queuing up and executing a recipe.

When dealing with executing new recipes, the Activies Panel will display the following items:

- The name of the recipe to be executed (falling back to the name of the current verb)
- A selection list of verbs. If a specific recipe is chosen, this will be filtered to verbs that could concievably execute this recipe, given the recipe's limitations.
- A list of the chosen recipe's requirements. If a recipe was pre-selected (such as through the 'Craft Item' button), this will be fixed to that recipe. Otherwise, it will show the requirements of whatever recipe the current verb thinks you are trying to execute.
- Available slots for cards. Each of these show multiple details about the slot:
  - The name of the slot, if any
  - The required and essential aspects for the slot, along the top right of the slot
  - A searchable dropdown of all cards that could fit the slot
    - If a recipe is known, the dropdown will also list each card's relevant aspects that match the recipe's requirements.
    - If a recipe is known, the cards that contribute the most to the recipe's requirements will be sorted to the top of the list.
  - If a card is selected and a recipe is known, the aspects of the current card that match the requirements of the recipe will be shown underneath the selection list.
- A button to execute the recipe, along the bottom.

#### Ongoing Recipes

If a verb / situation / workstation is busy executing a recipe, it will be shown in the Activities Panel. Clicking on it will open more information about the ongoing verb in the panel.

It displays the following:

- The name of the current recipe, which may change over time as the activity progresses.
- The current description of the recipe
- Icons representing all cards stored in the verb. Focus them with the keyboard or hover over them with the mouse to get more information.
- Ongoing slots, if the recipe has any. These act the same as the slots in [Recipe Execution](#recipe-execution).
- A button to skip forward in time to when the current recipe timer completes. Note that this might not conclude the verb if another recipe begins after the current recipe ends.

#### Concluded Recipes

If a verb / situation / workstation has completed execution and is awating attention, it will be shown in the Activities Panel. Clicking it will open more information about the completed verb.

It displays the following:

- The name of the completed recipe
- All notes over the lifetime of the recipe. In particular, this shows all the details you receive from reading and mastering books that normally show up as clickable icons in-game.
- The final output of the recipe. This usually includes a mix of cards you put in, and new cards generated by the recipe.
- A button to 'conclude' the verb, which is equivalent to clicking the "Conclude" button in-game. This will reset the verb to its idle state and empty all of its content. Emptied content will be moved back into the game world based on the game's automatic card placement algorithm.

##### Where did my items go?

When concluding recipes, all cards are sent to their 'home' location. For cards that previously existed, this was the last room or tray they were located in.

New items, however, do not have a home location, so they have to choose a location on their own. For some cards, like soul elements, this will be one of the trays. However, items like books and crafted materials must be stored somewhere in the library, so where do they go?

When trying to home a new physical item (such as books and materials), the game will try to put it in the player's inventory (called the 'portage'), which is located at the top of the screen in the game's UI. However, there are only 5 slots here, and this fills up rather fast.

If the portage is full, the items will instead be dumped on the grassy field between the `Watchman's Tower: Gatehouse` and the `Keeper's Lodge`. If you cannot find an item from a concluded verb, this is where it usually ends up.

This is not a problem unique to the Hush House Catalogue, as this happens during normal gameplay if you are not fastidious about your inventory management. However, the catalogue is particularly vulnurable to it as it currently provides no method of managing your inventory or moving items around.

Players who use the catalogue as an addenda to the game's own UI should take care to keep their inventory clean and organized to avoid this problem. For users using screen readers, or who otherwise wish to stick to the catalogue and ignore the game's ui, this is a non-issue as the catalogue will find and display these items like any other.

### Global Search

To search the entire catalogue, click the "Search" button at the top of the screen, or use it's shortcut, Ctrl+K. This will open a dialog in which you can type a search query to find any item across all pages of the catalogue.

Typing a search query will attempt to find items matching the search. Generally, the search will take into account names, descriptions, and aspects of various items and recipes. When using multiple words, items will be returned that contain all words regardless of their order.

The search query can also contain aspect names. When the name of an aspect is searched for, the catalogue will search all cards that contain that aspect. This is most useful for when you want to quickly find cards of a certain type. For example, `memory knock` will list all existing memory cards with a knock aspect, and all known crafting recipes and books that yield such a card when crafted or read.

Selecting search result items will open the containing page and filter it to only show that item.

Items may also have buttons for quick access to functions such as camera focus and crafting.

### Pinning

Pinning lets you stick either a recipe, a card, or even a potential card (such as a memory from a book or the crafted item of a recipe), to the top of the screen. This is done by clicking the pin icon for items listed on various pages.

Pinned items appear in the Pin List, located at the top right of the page, to the left of the Search box. It is not shown until at least one item is pinned.

Pinning is useful if you want to plan ahead on what cards you will need to collect in order to execute a recipe. The pin list will show a sum of each aspect shared by all pinned cards. If a Recipe is also pinned, it will only show aspects required by the recipe, and show a totalizer showing how much of that aspect you need for the recipe.

When you pin a Recipe, that recipe's name and requirements will be displayed on the top right of the screen, left of the Global Search. It will also pin the 'Primary Output' of the recipe as an icon, which can be focused with the keyboard or hovered over to display more information on that item.

When you pin a Card (or a Potential Card), the card's icon and aspects will appear in the pin list.

#### Future Plans for Pinning

At the moment, pinning only serves as a visual reminder. However, it is a work in progress. Plans for improvement here include:

- Pinning secondary recipes to pin their output as a Potential Card (eg: pinning the memory you get from reading a book) should allow you to execute the crafting recipe from the Pin List. Upon completion of this recipe, the pinned Potential Card should be replaced by the card produced by the recipe.
- When all requirements of a Pinned Recipe are satisfied, the Pin List should show a button to open the Activies Panel with that recipe and automatically select a suitable Workstation that accepts all pinned cards.

### Accessibility / Screen Reader support

The catalogue is continually being tested for Screen Reader support with the NVDA screen reader. While every major operating system includes it's own screen reader, NVDA was chosen as the primary reader to optimize for due to its robust support for HTML Tables, which this site relies heavily on. Using other screen readers is fully supported, but not actively tested for.

Screen reader support is a work in progress, but a high priority. Please report any issues or ideas for improvement to the GitHub issue tracker. If you run into any issues using any screen reader aside from NVDA, feel free to report those issues as well.

The rest of this section assumes you are using NVDA, and lists shortcuts using its default configuration. References to the `NVDA` key will be whatever key you configured to be your NVDA modifier key. By default, this key is `Insert`.

#### Preamble: How much of the game can be completed with a screen reader?

With the current release, only two aspects of the game are not implemented:

##### Committing Skills to the Tree of Wisdom

While it is possible to beat the game without the Tree of Wisdom, only one ending can be completed, and it takes extremely narrow circumstances. Tree of Wisdom support is therefor a requirement for a proper playthrough of the game. Tree of Wisdom support is under active development.

##### Moving Items between Rooms

The game can be completed without moving any items between rooms. All items will always be present in the catalogue regardlessof their location.

However, users who still interact with the game's own UI may find that items can pile up in the grassy field in front of the gate. For the cause and solution to this, see [Where did my items go?](#where-did-my-items-go).

#### Navigating the Catalogue

The bulk of the catalogue is split into [content pages](#page-breakdown). Navigation between these pages is done with the Navigation Tabs bar on the left of the screen. This can be focused from anywhere using NVDA by pressing `N`.

There are several global shortcuts available provided by the catalogue itself:

- To open the [Global Search](#global-search) dialog, press `Ctrl+K`.
- To toggle the [Activities Drawer](#global-search), press `Ctrl+O`
  - If the drawer is closed, it will be opened and focused
  - If the drawer is open and showing the activities list, it will be closed.
  - If the drawer is showing a specific activity, it will navigate back to the activities list.

You can get an entire overview of the catalogue's current state by pressing `NVDA+F7`. This allows you to navigate a simple tree layout of the catalogue, and jump to any section listed within.

The catalogue updates the page title based on the current selected page. If at any point you forget what page you are on, you can read the page title with `NVDA+T`.

##### Catalogue Landmarks

Screen readers navigate by Landmarks. The catalogue provides landmarks for all major areas of the page.

To navigate landmarks with NVDA, press `D` to navigate forward to the next landmark, and `Shift+D` to navigate to the previous one.

The landmarks provided by the catalogue in order of appearance are:

- Hand Overview: Cards that are important enough to show at all times. Usually, these are memories, assistants, visitors, or other cards that will decay over time.
- Pinboard: See [Pinning](#pinning). This will not be present if nothing has been pinned.
- Season and Time: Displays seconds remaining for the shortest ongoing recipe (if any), seconds remaining until the next day, the current season, and the number of days left in the current season.
- Open Activities button. This will not be present if the Activities Panel is open.
- [Activities Panel](#activities-panel): This will not be present if the Activities Panel is closed.
- Navigation: A list to navigate to any of the [content pages](#pages-breakdown) of the catalogue. This can also be navigated to directly with NVDA by pressing `N`.
- Main Content: The current active page, as selected

Additional pages may supply their own landmarks, depending on the page content. For example, the [Desk](#desk) page supplies a landmark for each of its sections.

#### Navigating Tables

This site heavily uses tables. Once NVDA is focused on a table, navigation is as follows:

- Next Cell in the Row: `Ctrl+Alt+Right Arrow`
- Previous Cell in the Row: `Ctrl+Alt+Left Arrow`
- Next Row with the same Column: `Ctrl+Alt+Down Arrow`
- Previous Row with the same Column: `Ctrl+Alt+Up Arrow`

When navigating tables with screen readers, using filters and sorting can greatly help find what you are looking for. Each header column can have a Filter or Sort button, depending on the column's contents.

Activating the Sort button will toggle the page sorting in this order: `Highest to Lowest`, `Lowest to Highest`, `Off`

Activating the Filter button will open a popup that constrains the screen reader to its contents, and can be closed by pressing `Esc`. Filters can vary depending on the column type, and most filters will have a Clear button as their first entry. Filters will either contain a text box for text columns, a list of aspects for aspect columns, a checkbox with an indeterminate state when not filtering, or a searchable multiselect dropdown for columns with fixed text values.

### Page Breakdown

The many aspects of the game are broken down into individual categorized pages.

Each page has an embellished name for the title bar, and a simple name used for tooltips, window title, and screen readers.

The following is an accounting of all pages, with the embellished name first, and the simple name contained in brackets.

#### Desk [Desk]

This provides a high level overview of the cards available to you, similar to the card trays of the main game.

#### Locations [Locations]

Provides a breakdown of all known locations.

- Focus the camera on location
- Unlock location (for locations that are locked. Locations can only be unlocked with the appropriate card.)
- Workspaces in the location
- Description

#### Brancrug and Environs [Brancrug]

Displays all workstations / verbs in the town of Brancrug, once unlocked.

The columns are:

- Focus the camera on a verb
- Execute a recipe using the verb (see [Recipe Execution](#recipe-execution))
- Name
- Primary aspects accepted
- Secondary card types accepted
- Description

#### Workstations [Workstations]

Displays all unlocked workstations throughout Hush House. Workstations in rooms that are not yet unlocked are not shown.

The columns are:

- Focus the camera on the workstation
- Execute a recipe using the workstation (see [Recipe Execution](#recipe-execution))
- Name
- Location
- Attunement (what powers are allowed in the workstation)
- Evolves (what skill discipline can be upgraded here)
- Accepts (What aspect types can be accepted by the 2 additional workstation slots)
- Description

#### Gardens and Glades [Harvest]

Displays all unlocked gardens and other spots of harvest

The columns are:

- Focus the camera on the garden
- Location in the House
- Description

#### Esoteric Wisdoms [Skills]

Displays all currently known skills

The columns are:

- Open the recipe executor to upgrade a skill (see [Recipe Execution](#recipe-execution))
- Name
- Skill level
- Aspects
- Wisdoms
- Whether the skill is committed to the wisdom tree
- Whether the skill has been attuned to make a new Soul card

#### The Fruits of Knowledge [Craftables]

Displays all unlocked crafting recipes. Crafting recipes are recipes triggered by skill cards, and are unlocked when you slot enough cards with the appropriate requirements alongside a skill card. A recipe does not need to be started to be unlocked.

The columns are:

- Pin the recipe to the page header (see [Pinning](#pinning))
- Open a recipe execution planner for the recipe (see [Recipe Execution](#recipe-execution))
- Name of the crafted item
- Aspects of the crafted item
- The skill that crafts the item
- Requirements to craft the item
- Description of the item

#### Bibliographical Collection [Books]

Displays books, phonographs, and films

- Focus the camera on the book
- Execute the "master a book" or "re-read a book" recipe (see [Recipe Execution](#recipe-execution))
- Name
- Location
- Mystery
- Mastered
- Provided memory name (for mastered books)
- Provided memory aspects (for mastered books)
- Language
- Type (book, phonograph, film)
- Contamination
- Description

#### Stores and Provisions [Provisions]

Displays consumables, servables, brewables, and drinkables

- Focus the camera on the item
- Name
- Location
- Type
- Aspects
- Description

#### Toolshed [Tools]

Displays all available tools through the house

- Focus the camera on the item
- Name
- Location
- Aspects
- Consumable (device)
- Description

#### Malleary Shelf [Materials]

Displays general crafting items

- Focus the camera on the item
- Name
- Location
- Aspects
- Type (various aspects like liquid, gem, flower, and so on)
- Description

#### Antiquities and Knicknacks [Things]

Displays 'things'. This is an esoteric assortment of objects tagged 'thing' by the game, and useful in crafting and book mastery.

- Focus the camera on the item
- Name
- Location
- Aspects
- Description

#### An Accounting of the Walls and Floors [Furnishings]

Displays comforts and wall art around the house. This is an esoteric assortment of objects tagged either 'comfort' or 'wall art' by the game, and useful in book mastery.

- Focus the camera on the item
- Name
- Location
- Aspects
- Type (comfort or wall art)
- Description

## Building and Development

### Dependencies

This project requires [Secret Histories API](https://github.com/SunsetFi/secrethistories-api-mod/) to be installed in Book of Hours. Without it, this project cannot access the game engine and will be unable
to display any data.

### Building the project

This project uses [NodeJS](https://nodejs.org) as a build engine.

Once installed, the project dependencies can be installed with `npm install`, and the project itself can be built with `npm run build`.

### How to run locally

This project can be ran in one of two ways:

#### From the dev server

Run `npm start` in the root folder of the project to compile and run the webapp. It will then be available at `http://localhost:8080/catalogue`

#### From the Secret Histories API

Once built, the project contents should be placed into the `/web-content/catalogue` folder of the Secret Histories API mod. This will cause the API to run the website on your local PC. Once done, the catalogue can be accessed from `http://localhost:8081/catalogue` while the game is running.

## Known Issues

- Accessibility
  - Windows Narrator struggles with tables.
  - NVDA often reads labels twice on Chrome

## License

<img src="/src/assets/icons/sixthhistory.svg" align="left" width="75" height="75">

Hush House Catalogue is an independent work by SunsetFi and is not affiliated with Weather Factory Ltd, Secret Histories or any related official content. It is published under Weather Factory’s Sixth History Community License.
