# Hush House Catalogue

This is a cataloguing webapp that adds searching and filtering capabilities to [Book of Hours](https://store.steampowered.com/app/1028310/BOOK_OF_HOURS/).
It relies on the [Secret Histories API](https://github.com/RoboPhred/secrethistories-api/tree/main/SHRestAPI) mod, which provides game data access and hosts the webapp.

![ALT](/preview/preview.png)

It has been designed to provide an automatic spreadsheet, akin to those we might make manually while playing the game. It has been designed in a way as to not give any spoilers. Only items in unlocked rooms are shown, and only crafting recipes that have been discovered will be displayed.

## Features

This mod provides a sortable, filterable interface for various aspects. Where possible, it also provides a button to zoom the camera in on the item in question.

It has the following pages

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
