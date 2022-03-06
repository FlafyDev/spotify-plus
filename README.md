# Spotify+
### !! Still in development. A functioning version has not yet been released. !!
### !! This README is still a WIP. !!
A Spotify extension loader inspired from [BetterDiscord](https://github.com/BetterDiscord/BetterDiscord) and [Spicetify](https://github.com/khanhas/spicetify-cli).  

## How does it work
### Injection
Spotify+ injects Spotify's js files to:
1. Connect to the locally running Spotify+ server.
2. Use React and ReactDOM.
3. Use the Spotify's Platform class.

The injection only injects the necessary stuff so Spotify+ would break less often between versions.  
Additionally, instead of using regex to find certain code blocks, Spotify+ parses Spotify's JS files. Parsing is a lot slower than using regex but also a lot more reliable.

### Spotify+'s server
Spotify+ runs a local server on your machine using NodeJS.  
The server sends information such as JS scripts to run in Spotify and
eliminates the need for having all of the extension files inside Spotify's directory.

Additionally, if enabled in the settings, the server removes the boundaries of Spotify's environment allowing you to run stuff such as shell commands using `remoteEval`.

## Security
* Spotify+'s server can only be accessed if you have the `accessKey`, so 3rd party applications can't use it.  
* The `remoteEval` function is only usable by extensions if you enabled it in the settings.

## Settings
The settings file is located at `%APPDATA%\SpotifyPlus\settings.json`.  
List of available settings:
- `port` (default: `45565`) - Which port would Spotify+'s server be running at.
- `accessKey` (default: random uuid v4) - The `accessKey` Spotify+'s server uses.
- `remoteEval` (default: `false`) - Whether to enable the `remoteEval` feature.

## Support for Spicetify extensions
Planned.

## Themes
No Support.