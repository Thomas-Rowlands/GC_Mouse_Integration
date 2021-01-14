<!DOCTYPE html>
<html>

<head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <link rel="stylesheet" href="bootstrap-4.4.1/css/bootstrap.min.css">
      <link rel="stylesheet" href="css/style.css">

      <script src="https://code.jquery.com/jquery-3.4.1.min.js" integrity="sha256-CSXorXvZcTkaix6Yvo6HppcZGetbYMGWSFlBw8HfCJo=" crossorigin="anonymous"></script>
      <script src="https://code.jquery.com/ui/1.12.1/jquery-ui.min.js" integrity="sha256-VazP97ZCwtekAsvgPBSUwPFKdrwD3unUfSGVYrahUqU=" crossorigin="anonymous"></script>
      <script src="https://d3js.org/d3.v5.min.js"></script>
      <script src="bootstrap-4.4.1/js/bootstrap.bundle.min.js"></script>
      <script src="js/trees.js"></script>
</head>

<body>

      <div id="termDialog">
            <span>ID: </span><span id="termID"></span><br>
            <span>Name: </span><span id="termName"></span><br>
            <span>Synonyms: </span>
            <ul id="syns"></ul>
      </div>
      <div class="loading-container">
            <div class="loading">
                  <img src="img/Magnify-1s-200px.gif" />
                  <h4>Loading Term Matches</h4>
            </div>
      </div>
      <div class="tree-diagram"></div>
      <div class="mappings-container">
            <div class="mappings-inner-container">
                  <div class="mappings-left grid-item">
                        <div class="input-group mb-1">
                              <div class="dropdown">
                                    <button class="btn btn-info dropdown-toggle" type="button" id="ontDropdown1" data-ontology="HPO" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                          Human Phenotype Ontology (HPO)
                                    </button>
                                    <div class="dropdown-menu" aria-labelledby="ontDropdown1">
                                          <a class="dropdown-item" data-ontology="MeSH" href="#">Medical Subject Headings (MeSH)</a>
                                          <a class="dropdown-item" data-ontology="EFO" href="#">Experimental Factor Ontology (EFO)</a>
                                          <a class="dropdown-item" data-ontology="MP" href="#">Mammalian Phenotype Ontology (MP)</a>
                                          <a class="dropdown-item active" data-ontology="HPO" href="#">Human Phenotype Ontology (HPO)</a>
                                    </div>
                              </div>&nbsp;
                              <div class="input-group-prepend">
                                    <span class="input-group-text">Term:</span>
                              </div>
                              <input type="text" class="form-control" placeholder="Phenotype..." id="onto-input" />
                              <div class="input-group-append">
                                    <a class="form-control btn btn-info" id="searchBtn">Search</a>
                              </div>
                        </div>

                        <div class="onto-results-container">
                              <svg id="searchSVG">

                              </svg>
                        </div>
                  </div>
                  <div class="mappings-center grid-item">
                        <div id="mappingInfo">
                              <span id="ont_term_1"></span><span> maps to </span><span id="ont_term_2"></span>
                        </div>

                  </div>
                  <div class="mappings-right grid-item">
                        <div class="input-group mb-1">
                              <div class="dropdown">
                                    <button class="btn btn-info dropdown-toggle" data-ontology="MP" type="button" id="ontDropdown2" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                          Mammalian Phenotype Ontology (MP)
                                    </button>
                                    <div class="dropdown-menu" aria-labelledby="ontDropdown2">
                                          <a class="dropdown-item" data-ontology="HPO" href="#">Human Phenotype Ontology (HPO)</a>
                                          <a class="dropdown-item" data-ontology="MeSH" href="#">Medical Subject Headings (MeSH)</a>
                                          <a class="dropdown-item" data-ontology="EFO" href="#">Experimental Factor Ontology (EFO)</a>
                                          <a class="dropdown-item active" data-ontology="MP" href="#">Mammalian Phenotype Ontology (MP)</a>
                                    </div>
                              </div>
                        </div>

                        <div class="onto-match-results-container">
                              <svg id="resultsSVG">
                              </svg>
                        </div>
                  </div>
            </div>
      </div>


      <script>
            var searchTree = new CollapsableTree(ontology = "Human Phenotype Ontology");
            var mappingTree = new CollapsableTree(ontology = "Mammalian Phenotype Ontology", isResultsTree = true);
            // searchTree.load("onto-results-container");
            // mappingTree.load("onto-match-results-container", reverse=true);
      </script>
      <!-- Loading Icon provided by https://loading.io -->







      <div id="footer">
            <!-- BEGIN site/footer -->


            <div id="footer_menulinks">
                  <div id="footer_w3c" style="padding-left:0.5em">
                  </div>



                  <div id="f_menulinks" style="text-align: center;  clear: none; margin:auto;width:42%">
                        <a href="/info/about">About</a> &nbsp;&nbsp;
                        <a href="/info/about/disclaimer">Disclaimer</a>&nbsp;&nbsp;
                        <a href="/info//about/citations">Cite</a>&nbsp;&nbsp;
                        <a href="/info/about/contact">Contact us</a>&nbsp;&nbsp;
                        ©&nbsp;GWAS Central
                        <br></div>
            </div>



            <!-- END site/footer -->
      </div>




</body>

</html>