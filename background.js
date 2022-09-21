/* global browser */

const manifest = browser.runtime.getManifest();
const extname = manifest.name;
const groupIds = [ '1', '2','3','4' ];

const tabId2groupId = new Map();
const groupId2MuteStateValue = new Map();

for(const id of groupIds){
    groupId2MuteStateValue.set(id,true);
}

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

function toggleAudio(grpId) {
    const next_mute_state = groupId2MuteStateValue.get(grpId);
    for(let [k,v] of tabId2groupId){
        if(v === grpId){
            browser.tabs.update(k, { muted: next_mute_state });
        }
    }
    groupId2MuteStateValue.set(grpId, !next_mute_state);
}

browser.browserAction.onClicked.addListener( (tab) => {
        for(let [k,v] of tabId2groupId){
            browser.browserAction.setBadgeText({ tabId: k, text: ""} );
            browser.browserAction.disable(k);
        }
        tabId2groupId.clear();
        notify(extname, 'Cleared All Audio Tab Groups');
    /*
    const tabId = tab.id;
    if(tabId2groupId.has(tabId)){
        const groupId = tabId2groupId.get(tabId);
        for(let [k,v] of tabId2groupId){
            if(v === groupId){
                browser.browserAction.setBadgeText({ tabId: k, text: ""} );
                browser.browserAction.disable(k);
                tabId2groupId.delete(k);
            }
        }
        notify(extname, 'Unset Group ' + groupId);
    }
    */
});

browser.commands.onCommand.addListener( async (cmd) => {

    if(cmd.startsWith('Assign ')){
        const parts = cmd.split(' ');
        const groupId = parts[2];

        // clear old tabs of group
        for(let [k,v] of tabId2groupId){
            if(v === groupId) {
                browser.browserAction.setBadgeText({ tabId: k, text: ""} );
                browser.browserAction.disable(k);
                tabId2groupId.delete(k);
            }
        }

        // get new tabs for group
        const tabIds =(await browser.tabs.query({
            currentWindow: true,
            highlighted: true,
            hidden:false
        })).map(t => t.id)


        for(const tabId of tabIds){
            browser.browserAction.setBadgeText({ tabId, text: groupId} );
            browser.browserAction.enable(tabId);
            tabId2groupId.set(tabId, groupId);
        }
        notify(extname, 'Group ' + groupId  +' set with ' + tabIds.length + ' Tabs');

    }else
    if(cmd.startsWith('Toggle')){
       const parts = cmd.split(' ');
       const groupId = parts[2];
       toggleAudio(groupId);
    }
});

browser.tabs.onRemoved.addListener( (tabId) => {
    if(tabId2groupId.has(tabId)){
        //browser.browserAction.setBadgeText({ tabId, text: ""} );
        //browser.browserAction.disable(tabId);
        tabId2groupId.delete(tabId);
    }
});

browser.tabs.onActivated.addListener( (info) =>  {
    if(tabId2groupId.has(info.tabId)){
        // show the groupId on the badge
        browser.browserAction.setBadgeText({ tabId: info.tabId, text: tabId2groupId.get(info.tabId)} );
        browser.browserAction.enable(info.tabId);
    }
});

        browser.browserAction.disable();
