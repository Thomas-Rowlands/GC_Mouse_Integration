$(document).ready(function () {
    $("#prev_page_btn").on("click", getPreviousResults);
    $("#next_page_btn").on("click", getNextResults);
    $("#search_btn").on("click", search_click);
    $("#userSearchInput").on("keyup", retrieveLiveSearch);
});
var page_num = 1;
var offset = 20;
var result_total = 0;
var current_div = ".searchResultsContainer";

function show_loading_dialog() {
    $(".loading-container").fadeIn(300);
}

function hide_loading_dialog() {
    $(".loading-container").fadeOut(300);
}

function search_click() {
    page_num = 1;
    search();
}

function search() {
    show_loading_dialog();
    search_input = $("#userSearchInput").val();
    url_string = document.URL + "/controller.php?search=" + encodeURIComponent(search_input) + "&page=" + page_num + "&offset=" + offset;
    $.ajax({
        type: "GET",
        url: url_string,
        success: function (data) {
            var result = "<tr>";
            if (data) {
                data = JSON.parse(data);
                result_total = data[1];
                data = data[0];
                if (result_total > (page_num * offset))
                    $("#next_page_btn").removeClass("disabled");
                else
                    $("#next_page_btn").addClass("disabled");
                var headings = Object.keys(data[0]);
                headings.forEach(element => {
                    result += "<th>" + element + "</th>";
                });
                result += "</tr>";
                for (var i = 0; i < data.length; i++) {
                    result += "<tr onclick='getPhenotypeStats(\"" + data[i]["Mammalian Phenotype Ontology ID"] + "\");'>";
                    headings.forEach(element => {
                        result += "<td>" + data[i][element] + "</td>";
                    });
                    result += "</tr>";
                }
                $("#pageNum").text("Page " + page_num + " of " + Math.max(Math.ceil(result_total / offset), 1) + " (" + result_total + " records)");
                if (page_num > 1)
                    $("#prev_page_btn").removeClass("disabled");
                else
                    $("#prev_page_btn").addClass("disabled");
                $("#results-container").show();
                $("#searchResults").html(result);
            } else {
                $("#searchResults").html("<p style='text-align:center;'>No results found.</p>");
                $("#results-container").show();
            }
            hide_loading_dialog();
        }
    });
}

function getPreviousResults() {
    if (page_num > 1) {
        page_num -= 1;
        search();
    }
}

function getNextResults() {
    page_num += 1;
    search();
}

function liveSearchClick(term) {
    var selection = $(term).text();
    $("#userSearchInput").val(selection);
    $("#live-search").hide().empty();
    page_num = 1;
    search();
}

function retrieveLiveSearch() {
    var input = $("#userSearchInput").val();
    if (input.length > 0) {
        $.ajax({
            type: "GET",
            url: document.URL + "/livesearch.php?entry=" + encodeURIComponent(input),
            success: function (data) {
                $("#live-search").empty();
                if (data) {
                    data = JSON.parse(data);
                    if (data.length == 0) {
                        $("#live-search").hide();
                    } else {
                        data.forEach(term => {
                            $("#live-search").append("<a onclick=\"liveSearchClick(this);\">" + term + "</a>");
                        });
                        $("#live-search").show();
                    }

                }
            }
        });
    } else {
        $("#live-search").hide();
    }

}

function transition(ident, reverse = false) {
    $(current_div).toggle({
        effect: "slide",
        queue: false,
        direction: (reverse) ? "right" : "left",
        // duration: "slow",
        complete: function () {
            $(ident).toggle({
                effect: "slide",
                // duration: "slow",
                queue: false,
                direction: (reverse) ? "left" : "right"
            })
        }
    });
    current_div = ident;
}

function getPhenotypeStats(term) {
    show_loading_dialog();
    $.ajax({
        type: "GET",
        url: document.URL + "/controller.php?homologSearch=true&term=" + encodeURIComponent(term),
        success: function (data) {
            $("#live-search").empty();
            if (data) {
                data = JSON.parse(data);
                if (data.length == 0) {
                    
                } else {
                    
                }

            }
            hide_loading_dialog();
            transition("#phenotypeResultsContainer");
        }
    });
}