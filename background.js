/*
    Firefox addon "Mobile Media Blocker"
    Copyright (C) 2019  Manuel Reimer <manuel.reimer@gmx.de>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

// Global variable to remember/communicate the current media filter status
let media_blocked = true;

// First stage of filter
// This one can act before the first byte of media is transferred
// Only works if URL is source of an <video> or <audio> tag.
browser.webRequest.onBeforeRequest.addListener(
  function(requestDetails){
    if (!media_blocked)
      return;

    console.log("Cancelling media");
    return {cancel: true};
  },
  {urls: ["<all_urls>"], types: ["media"]},
  ["blocking"]
);

// Second stage of filter
// This one catches media that is dynamically loaded
// Filters out based on the content type.
browser.webRequest.onHeadersReceived.addListener(
  function(requestDetails) {
    if (!media_blocked)
      return;

    for (let header of requestDetails.responseHeaders) {
      if (header.name.toLowerCase() == "content-type") {
        const value = header.value.toLowerCase();
        if (value.startsWith("audio/") || value.startsWith("video/")) {
          console.log("Cancelling xhr media");
          return {cancel: true};
        }
      }
    }
  },
  {urls: ["<all_urls>"], types: ["xmlhttprequest"]},
  ["blocking", "responseHeaders"]
)


// Fired if the toolbar button is clicked.
// Toggles the cache setting.
function ToolbarButtonClicked() {
  media_blocked = !media_blocked;
  UpdateTitle();
}

// Sets browserAction title based on media blocking status.
function UpdateTitle() {
  const title = browser.i18n.getMessage("button_title") + " (" +
    browser.i18n.getMessage(media_blocked?"title_disabled":"title_enabled") +
    ")";

  browser.browserAction.setTitle({title: title});
}

// Fired if the internet connection type changes
function ConnectionTypeChange() {
  media_blocked = (navigator.connection.type === "cellular")
  UpdateTitle();
}

// If we have the NetworkInfo API, then register for change events and call
// the connection type change handler for the first time
if (navigator.connection !== undefined) {
  navigator.connection.addEventListener("typechange", ConnectionTypeChange);
  ConnectionTypeChange();
}

// Register event listeners
browser.browserAction.onClicked.addListener(ToolbarButtonClicked);

// Update title for the first time
UpdateTitle();
