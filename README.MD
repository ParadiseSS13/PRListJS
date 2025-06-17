# Paradise PR Tracker Page

This is the page we use for tracking votes on PRs. It was one of my first react apps and is written awfully, but hey, thats how it be.

## Frontend

### Building

1. `npm install` and let the neutron star birth in your hard drive.
2. `npm run build` to generate the `dist` folder.
3. Copy the assets to your preferred webroot location.

### Developing

1. `npm install`.
2. `npm run start` for a webpack dev server.
3. Edit `src\js\core\api.js` and change `export const API = new ApiManager();` to `export const API = new ApiManagerMock();` to be able to actually mock API calls.

## Page Backend

The backend can be found in `prs_api.php`. It's PHP because thats what the forums use and we can easily integrate with the forum at a code level without needing to do a ton of rest calls. It's awfully made but it works, and seamlessly does RBAC based on forum groups for what part of the dev team you are in.

## PR Labeller Backend

Repo will be published soon, its mid retooling.

### Running

1. Get a copy of Invision Community. The instructions for this are out of scope for this readme.
2. Deploy `schema.sql` and setup the credentials appropriately in the `getPrDB()` function.
3. Put this script somewhere in a subdirectory of the main IPB folder, so that `../init.php` is relative to it.
4. Tweak all the group mappings for your own testing.
5. Point the API controller at it - note that CORS may royally screw you over here because it relies on sending the forum cookies to auth your session.

## Security

If you find anything glaringly wrong with this please `affectedarc07` on discord know.

## License

This repository is licensed under AGPL-3. You can find a copy in `LICENSE.MD`.
