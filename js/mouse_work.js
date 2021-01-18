$(document).ready(function () {

});

function show_loading_dialog() {
    $(".loading-container").fadeIn(300);
}

function hide_loading_dialog() {
    $(".loading-container").fadeOut(300);
}

function loadPhenotypeSearch() {
    $(".menu").hide(
        {
            effect: "fade",
            duration: 500,
            complete: function () {
                loadSubDocument("phenotype-search.html");
                $("#subdocument-iframe").show("fade", 500);
            }
        });
}

function loadSubDocument(test) {
    $("#subdocument-iframe").attr("src", test);
}