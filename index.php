<!DOCTYPE html>
<html>

<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <title>Ontology Mapping</title>
    <link rel="stylesheet" href="css/gwascentral.css">
    <link rel="stylesheet" href="bootstrap-4.4.1/css/bootstrap.min.css">
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="https://code.jquery.com/ui/1.12.1/themes/smoothness/jquery-ui.css">
    <script src="https://code.jquery.com/jquery-3.4.1.min.js" integrity="sha256-CSXorXvZcTkaix6Yvo6HppcZGetbYMGWSFlBw8HfCJo=" crossorigin="anonymous"></script>
    <script src="https://code.jquery.com/ui/1.12.1/jquery-ui.min.js" integrity="sha256-VazP97ZCwtekAsvgPBSUwPFKdrwD3unUfSGVYrahUqU=" crossorigin="anonymous"></script>
    <script src="bootstrap-4.4.1/js/bootstrap.bundle.min.js"></script>
    <script src="js/mouse_work.js"></script>
    <script src="https://code.jquery.com/ui/1.12.1/jquery-ui.js"></script>
</head>

<body>
    <div class="loading-container">
        <div class="loading">
            <img src="images/Magnify-1s-200px.gif" />
            <h4>Loading...</h4>
        </div>
    </div>
    <div class="floatholder">
        <div id="header">

            <!-- BEGIN site/header -->
            <div style="width:100%">
                <img onclick="goToPage('index')" onmouseover="this.style.cursor='pointer';" src="images/gwas-central-logo.png" alt="" style="vertical-align: bottom; position: absolute; top: 20px; left: 70px; cursor: pointer;">
                <div id="header_menulinks">
                    <div id="h_menulinks" style="padding-right:0.5em">
                        <a href="/info/data/database-content">Data</a>&nbsp;&nbsp;
                        <a href="/info/how-to/submit-data">Submit</a>&nbsp;&nbsp;
                        <a href="/info/data/download">Download</a>&nbsp;&nbsp;
                        <a href="/info">Help</a>
                    </div>
                </div>
                <div style="float:right;padding-top:1.5em;padding-right:1em;clear:right">
                    <form action="/search" name="searchform" id="searchform">
                        <fieldset>
                            <img src="images/section/search.png" alt="">&nbsp;<input name="q" type="text" id="minisearch" size="18" value="" alt="" autocomplete="off" class="ac_input"><label>&nbsp;</label>
                        </fieldset>
                    </form>
                </div>
                <div class="explore_panel">
                    <div style="width:100%">
                        <div style="float:right;width:100%">
                            <div class="main-tab-container">
                                <div class="main-tab">
                                    <div style="width:106px"><a style="font-size:0.8em"></a></div>
                                    <a href="" style="font-size:0.8em">
                                        <img src="images/section/mouse.png" alt="" style="width:32px;height:32px"><br>
                                        <div style="height:2em;margin-top:0.5em">Homology</div>
                                    </a>
                                </div>
                            </div>
                            <div class="main-tab-container">
                                <div class="main-tab">
                                    <div style="width:106px"><a href="/gwasphenomap" style="font-size:0.8em"></a></div>
                                    <a href="/gwasphenomap" style="font-size:0.8em">
                                        <img src="images/section/compass.png" alt="" style="width:32px;height:32px"><br>
                                        <div style="height:2em;margin-top:0.5em">PhenoMap</div>
                                    </a>
                                </div>
                            </div>
                            <div class="main-tab-container">
                                <div class="main-tab">
                                    <div style="width:106px"><a href="/biomart" style="font-size:0.8em"></a></div><a href="/biomart" style="font-size:0.8em">
                                        <img src="images/section/gwasmart.png" alt="" style="width:32px;height:32px"><br>
                                        <div style="height:2em;margin-top:0.5em">GWAS Mart</div>
                                    </a>
                                </div>
                            </div>
                            <div class="main-tab-container">
                                <div class="main-tab">
                                    <div style="width:106px"><a href="/browser" style="font-size:0.8em"></a></div><a href="/browser" style="font-size:0.8em">
                                        <img src="images/section/browser.png" alt="" style="width:32px;height:32px"><br>
                                        <div style="height:2em;margin-top:0.5em">Browser</div>
                                    </a>
                                </div>
                            </div>
                            <div class="main-tab-container">
                                <div class="main-tab">
                                    <div style="width:106px"><a href="/markers" style="font-size:0.8em"></a></div><a href="/markers" style="font-size:0.8em">
                                        <img src="images/section/markers.png" alt="" style="width:32px;height:32px"><br>
                                        <div style="height:2em;margin-top:0.5em">Markers</div>
                                    </a>
                                </div>
                            </div>
                            <div class="main-tab-container">
                                <div class="main-tab">
                                    <div style="width:106px"><a href="/studies" style="font-size:0.8em"></a></div><a href="/studies" style="font-size:0.8em">
                                        <img src="images/section/studies.png" alt="" style="width:32px;height:32px"><br>
                                        <div style="height:2em;margin-top:0.5em">Study List</div>
                                    </a>
                                </div>
                            </div>
                            <div class="main-tab-container">
                                <div class="main-tab">
                                    <div style="width:106px"><a href="/generegion" style="font-size:0.8em"></a></div><a href="/generegion" style="font-size:0.8em">
                                        <img src="images/section/genes.png" alt="" style="width:32px;height:32px"><br>
                                        <div style="height:2em;margin-top:0.5em">Gene/Region</div>
                                    </a>
                                </div>
                            </div>
                            <div class="main-tab-container">
                                <div class="main-tab">
                                    <div style="width:106px"><a href="/phenotypes" style="font-size:0.8em"></a></div><a href="/phenotypes" style="font-size:0.8em">
                                        <img src="images/section/phenotypes.png" alt="" style="width:32px;height:32px"><br>
                                        <div style="height:2em;margin-top:0.5em">Phenotypes</div>
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div style="float:right;width:100%" class="main-tab-base-row">
                            <div class="main-tab-container">
                                <div class="main-tab-base"></div>
                            </div>
                            <div class="main-tab-container">
                                <div class="main-tab-base"></div>
                            </div>
                            <div class="main-tab-container">
                                <div class="main-tab-base"></div>
                            </div>
                            <div class="main-tab-container">
                                <div class="main-tab-base"></div>
                            </div>
                            <div class="main-tab-container">
                                <div class="main-tab-base"></div>
                            </div>
                            <div class="main-tab-container">
                                <div class="main-tab-base"></div>
                            </div>
                            <div class="main-tab-container">
                                <div class="main-tab-base"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    </form>
    </div>
    <!-- Search Results Table -->
    <div class="searchResultsContainer">
        <!-- Orthology Selection -->
        <div class="orthology-menu">
            <h4>Search for comparative data on human-mouse homologues.</h4>
            <form class="form">
                <div class="input-group mb-3 mx-auto">
                    <input type="text" class="form-control" id="userSearchInput" autocomplete="off" placeholder="Phenotype Search (e.g. body fat)">
                    <div id="live-search" class="suggestions">

                    </div>
                </div>
                <div class="input-group form-inline mb-3 mx-auto">
                    <div class="input-group-prepend">
                        <div class="input-group-text">P-value threshold:</div>
                    </div>
                    <select class="form-control" id="thresholdSelect">
                        <option>-log P ≥ 0</option>
                        <option>-log P ≥ 1</option>
                        <option>-log P ≥ 2</option>
                        <option>-log P ≥ 3</option>
                        <option>-log P ≥ 4</option>
                        <option>-log P ≥ 5</option>
                        <option>-log P ≥ 6</option>
                        <option>-log P ≥ 7</option>
                        <option>-log P ≥ 8</option>
                        <option>-log P ≥ 9</option>
                        <option>-log P ≥ 10</option>
                    </select>
                </div>
                <div class="input-group-inline">
                    <button type="button" class="btn" id="search_btn">Search</button>
                </div>

        </div>
        <div id="results-container" class="container">
            <div class="row">
                <div class="col">
                    <a class="table-prev btn btn-link disabled" id="prev_page_btn">
                        <- Previous Page</a> </div> <div class="col">
                            <span class="page-counter" id="pageNum">Page 1</span>
                </div>
                <div class="col">
                    <a class="table-next btn btn-link disabled" id="next_page_btn">Next Page -></a>
                </div>
            </div>
            <br>
            <table class="info">
                <tbody id="searchResults">

                </tbody>
            </table>
        </div>
    </div>
    <!-- Phenotype selection results drill down -->
    <div id="phenotypeResultsContainer" class="container">
        <a class="btn btn-link" onclick="transition('.searchResultsContainer', true);">Back</a>
        <div class="phenotype-breakdown-container">
            <div class="row">
                <h3 id="Selected-Phenotype" class="col">MP:12345 - Micro Peen</h3>
            </div>
            <!-- Mappings -->
            <div class="row center">
                <div class="col">
                    <h3>Homo Sapiens</h3>
                </div>
                <div class="col">
                    <h3>Mus Musculus</h3>
                </div>
            </div>
            <div class="row">
                <div class="col">
                    <span>Human Phenotype Term: </span>
                </div>
                <div class="col">
                    <p id="HPO-Matched-Term">HP:12345 Microscopic Penis</p>
                </div>
                <div class="col">
                    <span>Mammalian Phenotype Term: </span>
                </div>
                <div class="col">
                    <p id="MP-Matched-Term">MP:12345 Micro Peen</p>
                </div>
            </div>
            <!-- Synonyms -->
            <div class="row">
                <div class="col">
                    <span>Synonyms: </span>
                </div>
                <div class="col">
                    <ul>
                        <li>test1</li>
                        <li>test1</li>
                        <li>test1</li>
                        <li>test1</li>
                    </ul>
                </div>
                <div class="col">
                    <span>Synonyms: </span>
                </div>
                <div class="col">
                    <ul>
                        <li>test1</li>
                        <li>test1</li>
                        <li>test1</li>
                        <li>test1</li>
                    </ul>
                </div>
            </div>
            <!-- Studies/Experiments -->
            <div class="row">
                <div class="col">
                    <span>GWAS Studies: </span>
                </div>
                <div class="col">
                    <p>12</p>
                </div>
                <div class="col">
                    <span>Gene Knockouts: </span>
                </div>
                <div class="col">
                    <p>23</p>
                </div>
            </div>
            <!-- Homolog Gene Studies/Experiments -->
            <div class="row">
                <div class="col center">
                    <span><span id="numHomologousGenes">5</span> Homologous Genes Identified</span>
                </div>
            </div>
            <div class="row">
                <div class="col center">
                    <span>GWAS Studies</span>
                </div>
                <div class="col center">
                    <Span>Gene Knockouts</Span>
                </div>
            </div>
            <div id="homolog-studies-experiments">
                
            </div>
        </div>
    </div>
</body>

</html>