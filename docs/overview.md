# Project Overview

- [React app](#react-app)
- [Front end structure](#front-end-structure)
- [Account Modal](#account-modal)
- [Public Directory Structure](#public-directory-structure)
- [Express app](#express-app)
- [Files](#files)

This document provides an overview of the file and folder structure of the project, explaining how different components and resources are organized.

**POWERBACK.us** is a _MERN_ app. It uses a [MongoDB](https://www.mongodb.com/docs/) [Atlas](https://www.mongodb.com/docs/atlas/getting-started/) database, [Express](https://expressjs.com/en/api.html) for middleware, a [React](https://react.dev/) front end framework, and runs on [Node.js](https://nodejs.org/en/docs).

**Total accessibility** was the driver behind the front end design, and third-party dependencies were chosen based on the maximum compability with this goal.

**POWERBACK.us** is currently in public Beta.

## Project Organization

- **(Root Directory):** The root directory contains project-level files, including configuration files, READMEs, and the back end application server file, [`app.js`](../app.js).

### React app

- **`/client/src/../`** The source directory holds all the front end source code for the React app portion of this project.
  - [`/src/api`](../client/src/api) This folder contains the API that the front end React app uses to connect to the back end Express app. See the [API Directory](./API.md) for all endpoints.

  - [`/src/components`](../client/src/components) This folder contains reusable UI components and widgets used throughout the application.

  - [`/src/constants`](../client/src/constants) This folder contains constant values such as website copy and values that rarely change.

  - [`/src/hooks`](../client/src/hooks) This folder contains custom React hook logic.

  - [`/src/img`](../client/src/img) This folder contains visual assets and media.

  - [`/src/interfaces`](../client/src/interfaces) This folder contains custom Interfaces for unique object shapes.

  - [`/src/pages`](../client/src/pages) This folder contains the TSX to build the HTML layouts for the application's pages.

  - [`/src/styles`](../client/src/styles) CSS tokens and global style utilities. See [`client/src/styles/STYLES.md`](../client/src/styles/STYLES.md) and the [Design System](./design-system.md).

  - [`/src/tuples`](../client/src/tuples) This folder contains fixed datasets from the real world, such as the 50 US states.

  - [`/src/types`](../client/src/types) This folder contains custom Types for more complex data objects. See [Common Props (type slices)](./common-props.md) for reusable prop slice types used by components.

  - [`/src/utils`](../client/src/utils) Utility functions and helper scripts are placed in this folder.

- **[`/public`](../client/public)** The public directory contains static assets that are publicly accessible, such as images, fonts, and other resources.

  #### Public Directory Structure

  The `/public` directory is organized as follows:

  **Root Level (`/client/public/`):**
  - **HTML/Config Files**: `index.html`, `manifest.json`, `robots.txt`, `sitemap.xml`, `favicon.ico`
  - **boofies/**: `fallback.html` (standalone server-down page)
  - **Primary Images**: Core application images like `banner.webp`, `cable-nav.webp`, `logo192.webp`, background images (`bg-1920x1280.webp`, `bg-2560x1440.webp`), and illustration images
  - **PDF Documents**: `POWERBACK_Position_Paper_v1.0.pdf`
  - **Profile Pictures**: `/pfp/` subdirectory containing politician profile pictures (267+ files)

  **Assets Subdirectory (`/client/public/assets/`):**
  - **Data Files**: `countries.js`, `states.js` (static datasets)
  - **Snapshot Files**: `electionDates.snapshot.json` (backend-generated)
  - **Video Files**: `explainer.mp4`, `explainer.webm`
  - **Miscellaneous Images**: `flag.gif`, `truth_social.png`, `truth_social.svg`

  **Path Conventions:**
  - **Absolute paths** (recommended): Use `/` prefix for root files (`/banner.webp`, `/cable-nav.webp`) or `/assets/` for assets (`/assets/flag.gif`, `/assets/electionDates.snapshot.json`)
  - **Relative paths**: Some legacy code uses `../assets/` or `../pfp/` patterns - these work but are more fragile
  - **Environment-aware**: Use `process.env.PUBLIC_URL || ''` prefix when building paths dynamically for production compatibility

  **Decision Guide for New Files:**
  - **Root level**: HTML files, config files (manifest, robots, sitemap), favicon, and frequently-referenced primary images
  - **`/assets/`**: Data files, snapshots, videos, and less-frequently-referenced images
  - **`/pfp/`**: Keep profile pictures in the existing subdirectory (large collection, many references)

  **Note**: The current structure has some inconsistencies in path patterns (absolute vs relative). When adding new files, prefer absolute paths (`/assets/...` or `/...`) for better maintainability.

#### Front end structure

The app is made up of several pages - [`Login`](../client/src/pages/Login/), [`Funnel`](../client/src/pages/Funnel/), [`Reset`](../client/src/pages/Reset/), and [`Unsub`](../client/src/pages/Unsub/). After logging in, the user will experience the app through the **Funnel** page. In case a user forgets their password, they can visit the **Reset** page. The **Reset** and **Unsub** pages use the shared [`MagicLink`](../client/src/components/page/MagicLink/) component for consistent hash verification and user experience. Account activation is handled automatically via email links and redirects to the home page with a success notification.

The **Funnel** page has four major elements arranged in a funnel-like procession for the user to customize and submit a **[`Celebration`](FAQ.md/#celebrations)**, which is a campaign donation to be delivered upon the occurrence of a real-world political event. The four elements are:

- [`/Lobby`](../client/src/pages/Funnel/TabContents/Lobby/) user chooses a candidate recipient and donation amount
- [`/Payment`](../client/src/pages/Funnel/TabContents/Payment/) user submits credit card information
- [`/TipAsk`](../client/src/pages/Funnel/TabContents/TipAsk/) user is asked if they would like to leave a tip for **POWERBACK.us** before confirming payment
- [Confirmation step](../client/src/pages/Funnel/TabContents/Support/) Celebration is confirmed. User is informed about **POWERBACK.us's** not-for-profit status and asked to give support

  The **Design Celebration** subsection is the most complex page of the application. Here is where users will make all their major decisions behind their **Celebrations**.

  This page has three major UI interfaces:
  - a [`Search`](../client/src/components/search/) bar with three search category options
  - a [`Carousel`](../client/src/components/interactive/PolCarousel/) of official profile pictures of House members for the users to make their selections
  - a [`Button Grid`](../client/src/components/interactive/BtnGrid/) with monetary amounts (and a numerical input) where users to decide how much to give

  #### Account Modal

  The Account modal is a tabbed interface where users can provide personal information ([`Profile`](../client/src/pages/Funnel/modals/Account/subcomps/body/panes/Profile/)), view past [`Celebrations`](../client/src/pages/Funnel/modals/Account/subcomps/body/panes/Celebrations/), and adjust their Settings, reset their password, or delete their account ([`Settings`](../client/src/pages/Funnel/modals/Account/subcomps/body/panes/Settings/)).

  The modal can be accessed in two different ways depending on your device type:
  - For mobile, clicking the **POWERBACK.us** "cable" logo in the top-left of the screen opens the `Sidenav` menu, where a link named "Account" can be pressed to open the modal.
  - For desktop, the "Account" link appears in the top-right of the Navigation bar.

### Express app

The back end uses files kept in the following folders:

- **[`/routes/api`](../routes/api/)** this folder contains files that routes API requests from the front end, organized in the following files:
  - [`celebrations.js`](../routes/api/celebrations.js)
  - [`congress.js`](../routes/api/congress.js)
  - [`payments.js`](../routes/api/payments.js)
  - [`civics.js`](../routes/api/civics.js)
  - [`users.js`](../routes/api/users.js)
  - [`sys.js`](../routes/api/sys.js)

- **[`/controller`](../controller/)** this folder contains files that process the data sent from the front end via the API and processes data along with interacting with any third-party APIs as well as the MongoDB database. These files are organized in the following folders corrosponding with `/routes/api`:
  - [`/celebrations`](../controller/celebrations/)
  - [`/congress`](../controller/congress/)
  - [`/payments`](../controller/payments/)
  - [`/civics`](../controller/civics/)
  - [`/comms`](../controller/comms/) - manages outgoing email communication with FEC compliance disclaimers (no corresponding routes) - [Email System Documentation](./email-system.md)
  - [`/users`](../controller/users/)
  - [`/sys`](../controller/sys/)

  - **[`/auth`](../auth/)** user authentication files using [JWT](https://jwt.io/introduction) - see [`docs/authentication-system.md`](./authentication-system.md) for comprehensive documentation

  - **[`/models`](../models/)** Schemas for MongoDB database documents are as follows:
    - [`Applicant.js`](../models/Applicant.js) a user in the process of making a new account, awaiting account verification,
    - [`Bill.js`](../models/Bill.js) data describing a Bill introduced in Congress, compiled by the [Congress.GOV API](https://api.congress.gov/),
    - [`Celebration.js`](../models/Celebration.js) schema for a document storing the details of a user Celebration involving a donation amount, a political candidate recipient, etc.,
    - [`ExUser.js`](../models/ExUser.js) document outlining a user that has deleted their account to prevent signing up again with the same username,
    - [`Pol.js`](../models/Pol.js) schema for a real politican in Congress, compiled by the [FEC API](https://api.open.fec.gov/developers/),
    - [`User.js`](../models/User.js) an approved user

## Files

- **[`README.md`](../README.md)** The main project README file, providing an introduction and essential information about the project.

- **[`package.json`](../package.json)** The package.json file defines project dependencies, scripts, and metadata.

- **[`client/craco.config.js`](../client/craco.config.js)** CRACO configuration for the client build (webpack aliases, dev server, etc.). No manual copy step required; run `npm install` then `npm run start` from the client directory.

- **[`.env`](./development.md#environment-variables)** Environment variables and sensitive data are stored in this file, ensuring security and configuration separation. See the [Development Setup Guide](./development.md) for configuration details.

- **[`.gitignore`](../.gitignore)** A list of files and directories excluded from version control with Git.

## Related Documentation

- [Development Setup Guide](./development.md) - Complete setup instructions
- [API Documentation](./API.md) - API endpoints and integration
- [Authentication System](./authentication-system.md) - JWT authentication
- [Background Jobs](./background-jobs.md) - Automated monitoring system
- [Payment Processing](./payment-processing.md) - Stripe integration
- [Email System](./email-system.md) - Email notifications
