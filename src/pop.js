function init() {
    // Clicking on labels should select checkbox
    $(".label").each(function (i,lab) {
        var checkbox = null;
        $(".setting input").each(function (j,cbox) {
            if ( $(cbox).attr("data-label") == $(lab).attr("data-label") ) {
                checkbox = $(cbox);
                return true;
            }
        });
        if ( !checkbox )
            throw new Error("No checkbox with data-label "+lab.attr("data-label"));

        $(lab).on( "click", e => checkbox.click() );
    });

    // Get images
    $("#bFind").on("click", function (e) {
        $("#bFind").attr("disabled", true);
        chrome.tabs.getSelected(null, function (tab) {
            getImages( getOpt("links"), getOpt("webm"), getOpt("thumb"), getOpt("follow") );
        });
    });
}
function getOpt( opt ) {
    var checked;
    $(".setting input").each(function (i, setting) {
        var set = $(setting);
        if ( set.attr("data-label") == opt ) {
            checked = set.is(":checked");
        }
    });
    if ( checked != (!!checked) )
        throw new Error("No such data-label "+opt+"!");
    return checked;
}

var foundImages = null;
function handleImgs( imgs ) {
    $("#fcount").html( imgs.length );
    $("#bFind").attr("disabled", false);
    $("#bSlide").attr("disabled", false);
    $("#nZIP").attr("disabled", false);
    foundImages = imgs;
}

$("#bSlide").on("click", function (e) {
    openAndSendImgs( chrome.extension.getURL("/slider/index.html") );
});
$("#nZIP").on("click", function (e) {
    openAndSendImgs( chrome.extension.getURL("/zipper/index.html") );
});

function openAndSendImgs( page ) {
    // First we create a new tab for our page. We don't select it at first to
    // keep the popup open.
    chrome.tabs.create({url: page,selected:false}, function ( created ) {
        // The page won't be able to recieve our message until it's fully
        // loaded, so we have to wait.
        var loaded = false;
        chrome.tabs.onUpdated.addListener(function (tabId, info) {
            if ( tabId == created.id && info.status == "complete" && !loaded ) {
                loaded = true;
                // Now we can send the message with the images
                chrome.tabs.sendMessage(created.id, {
                    what: "view",
                    imgs: foundImages,
                },{},function (res) {
                    // And, finally, we can select the tab
                    // (welcome to callback hell)
                    chrome.tabs.update(created.id, {selected: true});
                });
            }
        });
    });
}

function getImages(links, webm, thumb, follow) {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage( tabs[0].id,
                {ask: "collect", links:links, webm:webm, nothumb: thumb, follow},function (res) {
            handleImgs( res.imgs );
        });
    });
}
init();
