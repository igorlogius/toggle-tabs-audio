/* global browser */

let managedTabs = new Set();
let mute = true;

const manifest = browser.runtime.getManifest();
const extname = manifest.name;

function notify(title, message = "", iconUrl = "icon.png") {
    return browser.notifications.create(""+Date.now(),
        {
           "type": "basic"
            ,iconUrl
            ,title
            ,message
        }
    );
}

function toggleAudio() {
    for(const tabId of managedTabs) {
        browser.tabs.update(tabId, { muted: mute });
    }
    mute = (!mute);
}

browser.browserAction.onClicked.addListener( async () => {
    managedTabs = new Set(
        (await browser.tabs.query({
            currentWindow: true,
            highlighted: true,
            hidden:false
        })).map(t => t.id)
    );
    // reset mute action
    mute = true;
    notify(extname, 'Group with ' + managedTabs.size + ' Tabs created');
});

browser.commands.onCommand.addListener( (cmd) => {
    if (cmd === "toggle-audio") {
        toggleAudio();
    }
});

browser.tabs.onRemoved.addListener( (tabId) => {
    if(managedTabs.has(tabId)){
        managedTabs.delete(tabId);
    }
});

