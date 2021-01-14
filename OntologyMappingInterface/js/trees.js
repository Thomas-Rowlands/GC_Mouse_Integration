function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

$(document).ready(function (d) {
  $("#termDialog").dialog().dialog("close");
  $(document).mousemove(function (e) {
    $("#termDialog").dialog("option", "position", {
      my: 'left top+10%',
      at: 'left top',
      of: e
    });
  });
  $("#searchBtn").click(function (d) {
    search($("#onto-input").val(), $("#ontDropdown1").attr("data-ontology"), $("#ontDropdown2").attr("data-ontology"));
  });
  $(".dropdown-menu a").click(function () {
    var button = $(this).parent().siblings(".btn");
    $(button).text($(this).text());
    $(button).val($(this).text());
    $(button).attr("data-ontology", $(this).attr("data-ontology"));
    $(this).siblings().removeClass("active");
    $(this).addClass("active");
  });
});

function search(searchTerm, ont, ont2) {
  if (searchTerm) {
    LoadingDialog.show();
    $.ajax({
      url: "server/ontology.php?searchTerm=" + encodeURI(searchTerm) + "&ontology=" + encodeURI(ont) + "&ontologyTwo=" + encodeURI(ont2),
      success: function success(result) {
        if (result == "No match found.") {
          alert(result);
        } else {
          $("#searchSVG").empty();
          $("#resultsSVG").empty();
          searchTree = new CollapsableTree(ontology = $("#ontDropdown1").text());
          resultTree = new CollapsableTree(ontology = $("#ontDropdown2").text());
          result = JSON.parse(result);

          if (result.length == 2) {
            searchTree.load("onto-results-container", false, result[0]);
            resultTree.load("onto-match-results-container", true, result[1]);
            $("#ont_term_1").text(getFinalDescendent(result[0]).name);
            $("#ont_term_2").text(getFinalDescendent(result[1]).name);
          } else {
            searchTree.load("onto-results-container", false, result);
            $("#ont_term_1").text(getFinalDescendent(result).name);
            $("#ont_term_2").text("No Match Found.");
          }

          $("#mappingInfo").show();
        }

        LoadingDialog.hide();
      },
      error: function error(result) {
        console.log(result);
        LoadingDialog.hide();
      },
      datatype: "json"
    });
  }
}

function getFinalDescendent(nodeJson) {
  currentNode = nodeJson;

  while (currentNode.children.length != 0) {
    currentNode = currentNode.children[0];
  }

  return currentNode;
}

var LoadingDialog = /*#__PURE__*/function () {
  "use strict";

  function LoadingDialog() {
    _classCallCheck(this, LoadingDialog);
  }

  _createClass(LoadingDialog, null, [{
    key: "show",
    value: function show() {
      $(".loading-container").fadeIn(400);
    }
  }, {
    key: "hide",
    value: function hide() {
      $(".loading-container").fadeOut(400);
    }
  }]);

  return LoadingDialog;
}();

var CollapsableTree = /*#__PURE__*/function () {
  "use strict";

  function CollapsableTree() {
    var ontology = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
    var isResultsTree = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    _classCallCheck(this, CollapsableTree);

    _defineProperty(this, "treeData", {});

    this.ontology = ontology;
    this.isResultsTree = isResultsTree;
  }

  _createClass(CollapsableTree, [{
    key: "load",
    value: function load(target) {
      var reverse = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      this.treeData = data;
      this.renderTree(target, reverse);
    }
  }, {
    key: "renderTree",
    value: function renderTree(target) {
      var reverse = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var self = this;
      var treeData = this.treeData; //ensure the correct title is applied.

      $("." + target).on("mouseover", function () {
        $("#termDialog").dialog("option", "title", self.ontology);
      }); // Set the dimensions and margins of the diagram

      var margin = null;

      if (!reverse) {
        margin = {
          top: 20,
          right: 90,
          bottom: 30,
          left: 30
        };
      } else {
        margin = {
          top: 20,
          right: 30,
          bottom: 30,
          left: 90
        };
      }

      var width = $("." + target).width() - margin.left - margin.right,
          height = $("." + target).height() - margin.top - margin.bottom;
      var boxX = -10,
          boxY = -15,
          boxWidth = 100,
          boxHeight = 30; // appends a 'group' element to 'svg'
      // moves the 'group' element to the top left margin

      var svg = d3.select("." + target + " > svg").attr("width", width + margin.right + margin.left).attr("height", height + margin.top + margin.bottom).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")scale(.85, .85)"); //Enable zoom functionality

      d3.select("." + target).call(d3.zoom().on("zoom", function () {
        svg.attr("transform", d3.event.transform);
      })).on("dblclick.zoom", null);
      var i = 0,
          duration = 750,
          root; // declares a tree layout and assigns the size

      var treemap = d3.tree().size([height, width]); // Assigns parent, children, height, depth

      root = d3.hierarchy(treeData, function (d) {
        return d.children;
      });
      root.x0 = height / 2;
      root.y0 = reverse ? width : 0; // Collapse after the second level
      //root.children.forEach(collapse);

      update(root); // Collapse the node and all it's children

      function collapse(d) {
        if (d.children) {
          d._children = d.children;

          d._children.forEach(collapse);

          d.children = null;
        }
      }

      function update(source) {
        // Assigns the x and y position for the nodes
        var treeData = treemap(root); // Compute the new tree layout.

        var nodes = treeData.descendants(),
            links = treeData.descendants().slice(1);
        var mouseX, mouseY; // Normalize for fixed-depth.
  
        var boxX = -10,
            boxY = -15,
            boxWidth = 100,
            boxHeight = 30; 

        nodes.forEach(function (d) {
          d.y = reverse ? width - d.depth * 280 : d.depth * 280;
        }); // ****************** Nodes section ***************************
        // Update the nodes...

        var node = svg.selectAll('g.node').data(nodes, function (d) {
          return d.id || (d.id = ++i);
        }); // Enter any new modes at the parent's previous position.

        var nodeEnter = node.enter().append('g').attr('class', 'node').attr("transform", function (d) {
          return "translate(" + source.y0 + "," + source.x0 + ")";
        }).on('dblclick', click).on('click', function (d) {
          if (self.isResultsTree) $("#termMapped2").text(d.data.name);else $("#termMapped1").text(d.data.name);
          d3.selectAll("." + target + " .selected").classed('selected', false);
          d3.select(this).select("rect").attr("class", "selected");
          d3.select(this).select("text").attr("class", "selected");
        }).on("mouseover", function (d) {
          var g = d3.select(this); // The node
          // Populate the tooltip dialog

          $("#termName").text(d.data.name);

          if ("synonyms" in d.data) {
            var synHTML = "";
            d.data.synonyms.forEach(function (elem) {
              synHTML += "<li>" + elem + "</li>";
            });
            $("#syns").html(synHTML);
          }

          if ("ont_id" in d.data) {
            $("#termID").html(d.data.ont_id);
          }
        });
        $("g.node").on("mouseover", function (e) {
          $("#termDialog").stop(true).dialog({
            open: function open(event, ui) {
              $('.ui-dialog-titlebar-close').hide();
            },
            close: function close(event, ui) {
              $("#termName").empty();
              $("#syns").empty();
              $("#termID").empty();
            }
          });
        });
        $("g.node").on("mouseout", function (e) {
          $("#termDialog").stop(true).dialog("close");
        }); // Add rect for the nodes

        
        nodeEnter.append('rect').attr('class', 'node').attr("width", boxWidth).attr("height", boxHeight).attr("x", boxX).attr("y", boxY).style("stroke", function (d) {
          return d.children || d._children ? "blue" : "black";
        }); // Add labels for the nodes

        nodeEnter.append('text').attr("dy", ".35em").style("text-anchor", reverse ? "end" : "start").text(function (d) {
          return d.data.name.length > 35 ? d.data.name.substring(0, 34) + "..." : d.data.name;
        }); // UPDATE

        var nodeUpdate = nodeEnter.merge(node); // Transition to the proper position for the node

        nodeUpdate.transition().duration(duration).attr("transform", function (d) {
          return "translate(" + d.y + "," + d.x + ")";
        }); // Update the node attributes and style

        nodeUpdate.select('rect').attr('x', function (d) {
          return reverse ? boxX - this.nextElementSibling.getComputedTextLength() : boxX;
        }).attr('y', boxY).attr('width', function (d) {
          return this.nextElementSibling.getComputedTextLength() + 20;
        }).attr('height', boxHeight).attr('cursor', 'pointer'); // Remove any exiting nodes

        var nodeExit = node.exit().transition().duration(duration).attr("transform", function (d) {
          return "translate(" + source.y + "," + source.x + ")";
        }).remove(); // On exit reduce the node rect size to 0

        nodeExit.select('rect').attr('width', "0").attr('height', "0"); // On exit reduce the opacity of text labels

        nodeExit.select('text').style('fill-opacity', 1e-6); // ****************** links section ***************************
        // Update the links...

        var link = svg.selectAll('path.link').data(links, function (d) {
          return d.id;
        }); // Enter any new links at the parent's previous position.

        var linkEnter = link.enter().insert('path', "g").attr("class", "link").attr('d', function (d) {
          var oBoxWidth = d3.select(this.parentNode).select("rect").node().width.baseVal.value;
          var o = {
            x: source.x0 + oBoxWidth,
            y: source.y0
          };
          return diagonal(o, o);
        }); // UPDATE

        var linkUpdate = linkEnter.merge(link); // Transition back to the parent element position

        linkUpdate.transition().duration(duration).attr('d', function (d) {
          var dBoxWidth; //scale child node end point to touch rect line.

          if (typeof this.parentNode != "undefined") dBoxWidth = d3.select(this.parentNode).select("rect").node().width.baseVal.value;else dBoxWidth = d.y; //scale parent node start point to touch rect line.

          var parentBoxWidth = d3.selectAll(".node").filter(function (e) {
            return e.id == d.parent.id;
          }).select("rect").node().width.baseVal.value;
          var child = {
            x: d.x,
            y: reverse ? d.y + (dBoxWidth / 2 - 100) : d.y - (dBoxWidth / 2 - 100)
          };
          var parent = {
            x: d.parent.x,
            y: reverse ? d.parent.y - (parentBoxWidth - 10) : d.parent.y + (parentBoxWidth - 10)
          };
          return diagonal(child, parent);
        }); // Remove any exiting links

        var linkExit = link.exit().transition().duration(duration).attr('d', function (d) {
          var oBoxWidth = d3.select(this.parentNode).select("rect").node().width.baseVal.value;
          var o = {
            x: source.x,
            y: source.y - 10
          };
          return diagonal(o, o);
        }).remove(); // Store the old positions for transition.

        nodes.forEach(function (d) {
          d.x0 = d.x;
          d.y0 = d.y;
        }); // Creates a curved (diagonal) path from parent to the child nodes

        function diagonal(s, d) {
          var path = "M ".concat(s.y, " ").concat(s.x, "\n                  C ").concat((s.y + d.y) / 2, " ").concat(s.x, ",\n                    ").concat((s.y + d.y) / 2, " ").concat(d.x, ",\n                    ").concat(d.y, " ").concat(d.x);
          return path;
        } // Toggle children on click.


        function click(d) {
          if (d.children) {
            d._children = d.children;
            d.children = null;
          } else {
            d.children = d._children;
            d._children = null;
          }

          update(d);
        }
      }
    }
  }]);

  return CollapsableTree;
}();