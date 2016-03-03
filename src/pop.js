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
    chrome.tabs.create({url: page}, function ( created ) {
        chrome.tabs.sendMessage(created.id, {
            what: "view",
            imgs: foundImages,
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
