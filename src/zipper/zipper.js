chrome.runtime.onMessage.addListener(function (msg, sender, respond) {
    console.log( msg );
    images.add( msg.imgs );
});

function ImageSet(select) {
    this.select = select;

    this.imgs = [];
    this.iter = 1;
}
ImageSet.prototype.add = function (urls) {
    for ( url of urls ) {
        this.imgs.push({
            url: url,
            id: (++this.iter),
            active: true
        });
    }
    this.resetElem();
}
ImageSet.prototype.remove = function () {
    var elems = Array.prototype.map.call(
            this.select.children, x => x );
    for ( e of elems ) {
        if ( e.selected ) {
            for ( img of this.imgs ) {
                if ( parseInt(e.value,10) == img.id ) {
                    img.active = false;
                }
            }
        }
    }
    this.resetElem();
}
ImageSet.prototype.resetElem = function () {
    this.select.innerHTML = "";

    for ( img of this.imgs ) {
        if ( !img.active )
            continue;
        
        var elem = document.createElement("option");
        elem.innerText = "(" + img.url + ")";
        elem.value = img.id.toString(10);
        this.select.appendChild( elem );
    }
}
ImageSet.prototype.getList = function () {
    return this.imgs
        .filter( img => img.active )
        .map( img => img.url );
}
var images = new ImageSet( $("#imgSelect")[0] );

$("#remImg").on("click", function (event) {
    images.remove();
});
$("#addImg").on("click", function (event) {
    images.add(
            [ prompt("Enter Image URL: ", "http://example.org/eg.jpg") ]
            );
});

var finZip = null;
var stopCheck = false;
$("#startDown").on("click", function () {
    var imgs = images.getList();
    var zip = new JSZip();
    zip.file("images.txt", imgs.join("\n"));

    initDownload(zip, imgs);
});
$("#stopDown").on("click", function () {
    stopCheck = true;
});
$("#getDown").on("click", function () {
    window.open(
            URL.createObjectURL(
                new Blob(
                    [finZip.generate({
                        type: "uint8array"
                        })],
                    {type:"application/zip"}
                    )
                )
            );
});

function genFilename(index, url) {
    var ds = url.split(".");
    var itxt = index.toString(16);
    while ( itxt.length < 5 )
        itxt = "0"+itxt;

    return "IMG" + itxt + "." + ds[ds.length-1];
}
function initDownload(zip, urls) {
    $("#pDone")[0].max = urls.length;
    $("#pDone")[0].value = 0;
    $("#stopDown").prop("disabled", false);
    $("#getDown").prop("disabled", true);
    $("#startDown").prop("disabled", true);
    stopCheck = false;

    var i = 0;
    function next() {
        if ( stopCheck ) {
            $("#stopDown").prop("disabled", true);
            $("#startDown").prop("disabled", false);
            $("#getDown").prop("disabled", true);
            $("#dStat").html("Downloading stopped.");
            return;
        }

        if ( i >= urls.length ) {
            finZip = zip;
            $("#getDown").prop("disabled", false);
            $("#stopDown").prop("disabled", true);
            $("#startDown").prop("disabled", false);

            $("#dStat").html("All files complete.");
            return;
        }

        var url = urls[i];
        nextDown(url, function (res) {
            $("#dStat").html("File "+i+" of "+urls.length+"done.");

            var filename = genFilename(i, url);
            zip.file(filename, res);
            $("#pDone").val( i );
            i++;
            next();
        });
    }
    next();
}
function nextDown(url, cb) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.responseType = "arraybuffer";

    xhr.onload = function () {
        if (this.status == 200) {
            console.log( url );
            console.log( xhr.response );
            $("#preview").prop("src",
                    URL.createObjectURL(
                        new Blob( [xhr.response] )
                        )
                    );
            cb( xhr.response );
        }
    }
    xhr.onerror = function () {
        cb( new ArrayBuffer("THIS FILE DID NOT DOWNLOAD PROPERLY") );
        $("#dStat").html("A file did not download properly");
    }
    xhr.send();
}
