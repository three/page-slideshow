var manager = null;
chrome.runtime.onMessage.addListener(function (msg, sender, respond) {
    manager = new ImageManager( msg.imgs );
    manager.loadUI();
});

function genThumb(url) {
    var container = document.createElement("span");
    container.classList.add("v-thumb-cont");

    var thumb = new Image();
    thumb.src = url;
    thumb.classList.add("thumb");

    container.appendChild( thumb );

    return container;
}

function ImageManager(images) {
    if ( images.length < 1 )
        throw new Error("Must have at least one image to load!");

    this.current = -1;
    this.total = images.length;
    this.imgs = [];

    var man = this;
    var index = 0;
    for ( image of images ) {
        var img = {
            url: image,
            elem: new Image(),
            thumb: genThumb( image ),
            selected: false,
        };
        img.video = img.url.substr(-5) == ".webm";

        $(img.thumb).on("click", (function (i,im) {
            return function (event) {
                man.selectImg( i );
            }
        })(index,img) );

        img.elem.src = image;
        img.elem.classList.add("v-view");
        img.elem.classList.add("v-img");

        this.imgs.push( img );

        index++;
    }
}
ImageManager.prototype.loadUI = function () {
    for ( img of this.imgs ) {
        $("#thumbs").append( img.thumb );
    }
    this.updateUI();
    this.selectImg(0);
}
ImageManager.prototype.updateUI = function () {
    $("#hCounter").html(`${this.current+1}/${this.total}`);
}
ImageManager.prototype.scrollThumb = function (speed) {
    $("#thumbs").scrollLeft(
            $("#thumbs").scrollLeft()+speed
            );
}
ImageManager.prototype.selectImg = function (i) {
    if ( i >= this.total )
        throw new Error(
                "Can't switch to image "+i+
                ". Only "+this.total+" total images."
                );
    if ( this.current >= 0 ) {
        this.imgs[this.current].selected = false;
        this.imgs[this.current].thumb.classList.remove("selected");
    }
    this.current = i;

    if ( !this.imgs[i].video ) {
        $("#vView").prop("src", this.imgs[i].url);
        $("#vView")[0].classList.remove("noview");
        $("#vVid")[0].classList.add("noview");
    } else {
        $("#vVid").prop("src", this.imgs[i].url);
        $("#vView")[0].classList.add("noview");
        $("#vVid")[0].classList.remove("noview");
    }
    this.imgs[i].selected = true;
    this.imgs[i].thumb.classList.add("selected");

    this.updateUI();
}
ImageManager.prototype.nextImg = function () {
    if ( this.current >= this.total-1 )
        return;
    this.selectImg( ++this.current );
}
ImageManager.prototype.prevImg = function () {
    if ( this.current <= 0 )
        return;
    this.selectImg( --this.current );
}

// Events

var thumbScrollSpeed = 0;
function tick() {
    window.requestAnimationFrame( tick );
    if ( !manager )
        return;

    manager.scrollThumb( thumbScrollSpeed );
}
tick();

$("#thumbs").on("mouseover", function (event) {
    var prop = event.clientX / $(window).width();
    if ( prop > .7 )
        thumbScrollSpeed = 30*(prop-.7);
    else if ( prop < .3 )
        thumbScrollSpeed = -30*(.3-prop);
    else
        thumbScrollSpeed = 0;
});
$("#thumbs").on("mouseout", function (event) {
    thumbScrollSpeed = 0;
});

$(window).on("keydown", function (event) {
    switch (event.keyCode) {
        case 37: // LEFT
            manager.prevImg();
            break;
        case 38: // UP
            $("#header").toggleClass("noview");
            break;
        case 39: // RIGHT
            manager.nextImg();
            break;
        case 40: // DOWN
            $("#thumbs").toggleClass("noview");
            break;
    }
});

var timer = 0;
$("#hPlay").on("click", function (event) {
    if ( timer )
        clearInterval( timer );
    timer = setInterval(function () {
        manager.nextImg();
    }, parseInt($("#hDelay input").val(),10) );
});
$("#hPause").on("click", function (event) {
    clearInterval( timer );
    timer = 0;
});
