# Hush House Catalogue

This is a cataloging and auto-spreadsheet webapp that adds searching, sorting, and filtering capabilities for [Book of Hours](https://store.steampowered.com/app/1028310/BOOK_OF_HOURS/).
It relies on the [Secret Histories API](https://github.com/RoboPhred/secrethistories-api/tree/main/SHRestAPI) mod, which provides game data access and hosts the webapp.

![ALT](/preview/preview.png)

It has been designed to provide an automatic spreadsheet, akin to those we might make manually while playing the game. It has been designed in a way as to not give any spoilers. Only items in unlocked rooms are shown, and only crafting recipes that have been discovered will be displayed. It can additionally interact with the game engine itself, to queue up recipes or focus the camera on in-game items.

## Building

This project uses [NodeJS](https://nodejs.org) as a build engine.

Once installed, the project dependencies can be installed with `npm install`, and the project itself can be built with `npm run build`.

## Dependencies

This project requires [Secret Histories API](https://github.com/RoboPhred/secrethistories-api/tree/main/SHRestAPI) to be installed in Book of Hours. Without it, this project cannot access the game engine and will be unable
to display any data.

## How to run

This project can be ran in one of two ways:

### From the dev server

Run `npm start` in the root folder of the project to compile and run the webapp. It will then be available at `http://localhost:8080/catalogue`

### From the Secret Histories API

Once built, the project contents can be placed into the `web-content/catalogue` folder of the Secret Histories API. This will cause the API to self-host the website.
Once done, it can be accessed from `http://localhost:8081/catalogue`

## Features

This mod provides a sortable, filterable interface for various aspects. Where possible, it also provides a button to zoom the camera in on the item in question.

It has the following pages:

### Bibliographical Collection

Displays books, phonographs, and films

- Navigate to Item
- Name
- Location
- Mystery
- Mastered
- Provided memory name
- Provided memory aspects
- Language
- Type (book, phonograph, film)
- Contamination
- Description

### Stores and Provisions

Displays consumables, servables, brewables, and drinkables

- Navigate to Item
- Name
- Location
- Type
- Aspects
- Description

### Toolshed

Displays all available tools through the house

- Navigate to Item
- Name
- Location
- Aspects
- Consumable (device)
- Description

### Malleary Shelf

Displays general crafting items

- Navigate to Item
- Name
- Location
- Aspects
- Type (various aspects like liquid, gem, flower, and so on)
- Description

### Antiquities and Knicknacks

Displays 'things'

- Navigate to Item
- Name
- Location
- Aspects
- Description

### An Accounting of the Walls and Floors

Displays comforts and wall art around the house

- Navigate to Item
- Name
- Location
- Aspects
- Type (comfort or wall art)
- Description

### The Fruits of Knoweldge

Displays all discovered crafting recipes and what they craft.

- Skill recipe planner / executor
- Name
- Aspects (aspects of the item that is crafted, including powers and other attributes)
- Skill (the skill card needed to craft it)
- Description

### Workstations

Displays all unlocked workstations through the house

- Navigate to Item
- Name
- Location
- Attunement (what powers are allowed in the workstation)
- Evolves (what skill discipline can be upgraded here)
- Accepts (What aspect types can be accepted by the 2 additional workstation slots)
- Description

### Gardens and Glades

Displays all unlocked gardens and other spots of harvest

- Navigate to Item
- Location
- Description

### Memories

Displays all memories that have been encountered in the current save file

- Name
- Aspects
- Description
