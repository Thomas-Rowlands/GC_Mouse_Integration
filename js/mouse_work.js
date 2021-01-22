$(document).ready(function () {
    $(".menu > .row > .col").hover(function () {
        $(".menu > .row > .col:not(:hover)").css("background-color", "#e2e2e2");
        $(".menu > .row > .col:hover > object > svg").attr("fill", "blue");
    }, function () {
        $(".menu > .row > .col").css("background-color", "white");
    });
});

var menu_open = true;
var currentMenuItem = null;
var transition_speed = 250;
var iframe = "<iframe id=\"subdocument-iframe\"></iframe>";
window.onhashchange = function (e) {
    if (e.newURL == window.location.href.replace(window.location.hash, ""))
        reloadMainMenu();
};

function reloadMainMenu() {
    shrinkMenuItem(currentMenuItem);
}

function show_loading_dialog() {
    $(".loading-container").fadeIn(300);
}

function hide_loading_dialog() {
    $(".loading-container").fadeOut(300);
}

function loadPhenotypeSearch() {
    if (menu_open) {
        loadSubDocument("phenotypeSearchMenuItem", "phenotype-search.html");
        menu_open = false;
    }
}

function loadOntologyHierarchy() {
    if (menu_open) {
        loadSubDocument("ontologyHierarchyMenuItem", "OntologyMappingInterface/index.php");
        menu_open = false;
    }
}

function loadGeneSymbolSearch() {
    if (menu_open) {
        loadSubDocument("geneSymbolSearchMenuItem", "jbrowse/index.html?data=data");
        menu_open = false;
    }
}

function expandMenuItem(menuItem, url) {
    var card = $(".menu > .row > #" + menuItem)[0];
    $(card).stop().append(iframe);
    $(".menu > .row > .col > div").stop().hide("fade", transition_speed);
    $(".menu > .row > .col[id!='" + menuItem + "']").stop().animate({
        opacity: 0,
        duration: 500
    }, 500, "linear", function () {
        $(card).removeClass("menu-option");
        $(card).animate({
            height: "82vh",
            width: "100vw",
            "max-width": "100vw",
            margin: "0",
            left: "0"
        }, 500, function () {

            var test = $("#subdocument-iframe")[0];
            if (!test) {
                $(card).append(iframe);
                test = $("#subdocument-iframe")[0];
            }
            test.contentWindow.location.replace(url);
            $("#subdocument-iframe").stop().show("fade", transition_speed);
            menu_open = false;
        });
        $(card).animate({
            left: 0
        }, 500, function () {

        });
        $(".menu > .row > .col[id!='" + menuItem + "']").stop().hide(0, function() {
            $(card).css("position", "relative");
            $("#subdocument-iframe").css("position", "absolute").css("left", "0");
        });
        $(".menu").stop().animate({
            "margin-top": "0"
        }, 500);
    });
}

function shrinkMenuItem(menuItem) {
    var card = $(".menu > .row > #" + menuItem)[0];
    $(card).css("position", "absolute");
    $(card).find("iframe").stop().hide("fade", transition_speed, function () {
        $(card).find("iframe").remove();
        let left_positioning = (($(card).index() * 32) + 1).toString() + "vw";
        $(card).stop().animate({
            height: "70vh",
            width: "30vw",
            "max-width": "30vw",
            margin: "0.25em 0.25em 0.25em 2em",
            left: left_positioning
        }, transition_speed, function () {
            $(card).addClass("menu-option");
            $(".menu > .row > .col > div").stop().show("fade", transition_speed);
            $(".menu > .row > .col[id!='" + menuItem + "']").stop().show();
            menu_open = true;
        });

        $(".menu").stop().animate({
            "margin-top": "1em"
        }, 500);
        $(".menu > .row > .col[id!='" + menuItem + "']").stop().animate({
            opacity: 100,
            duration: 500
        }, 500);
    });


}

function loadSubDocument(menuItem, url) {
    currentMenuItem = menuItem
    window.location.hash = url.replace(".html", "");
    expandMenuItem(menuItem, url);
}