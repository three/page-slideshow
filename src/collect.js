(function () {

    function collectImages( incLinks, incWebm, noThumb, follow ) {
        var imgs = [];

        // Detect IMG tags
        eachQuery("img[src]", function (img) {
            if ( !noThumb || img.parentElement.tagName != "A" )
                imgs.push( img.src );
        });

        if ( incLinks ) {
            // Detect Links
            eachQuery("a[href]", function (a) {
                var link = absoluteURL(a.href);
                if ( follow )
                    link = followLink(link, incWebm);
                if ( isImageURL(link, incWebm) ) {
                    imgs.push( link );
                }
            });
        }

        return arrUnique( imgs );
    }

    function eachQuery( q, c ) {
        Array.prototype.forEach.call(
                document.querySelectorAll( q ), c
                );
    }

    function absoluteURL( url ) {
        var t = url.trim();
        if ( t.substr(0,4) == "http" ) {
            return t;
        }
        if ( t.substr(0,2) == "//" ) {
            return document.location.protocol + t;
        }
        if ( t.substr(0,1) == "/" ) {
            return document.location.protocol + "//" +
                document.location.hostname + t;
        }
        return t;
    }
    function isImageURL( url, webm ) {
        var ext3 = [".jpg",".png",".gif",".svg",".bmp"];
        var ext4 = [".jpeg"];

        if ( !(/^https?\:\/\/(.){2,}\/(.)*$/).test(url) )
            return false;
        if ( ext3.includes(url.substr(-4)) ) {
            return true;
        }
        if ( ext4.includes(url.substr(-5)) ) {
            return true;
        }

        if ( webm && url.substr(-5)==".webm" ) {
            return true;
        }

        return false;
    }
    function followLink( link, webm ) {
        var s = link.split("/");
        if ( s.length == 4 && s[2] == "imgur.com" ) {
            var g = s[3].split(".");
            if ( g.length >= 2 && g[1] == "gifv" ) {
                if ( webm )
                    return "http://i.imgur.com/"+g[0]+".webm";
                else
                    return "";
            }
            if ( g.length > 1 )
                return link;
            return "http://i.imgur.com/"+s[3]+".png";
        }
        return link;
    }
    function arrUnique( arr ) {
        return arr.reduce(function (a,e) {
            if ( a.indexOf(e) < 0 && e != "" )
                a.push(e);
            return a;
        }, []);
    }

    chrome.runtime.onMessage.addListener(function (msg, sender, respond) {
        if ( msg.ask == "collect" ) {
            var images = collectImages( msg.links, msg.webm, msg.nothumb, msg.follow );
            respond({
                    what: "collect",
                    imgs: images,
                   });
        }
    });

})();
