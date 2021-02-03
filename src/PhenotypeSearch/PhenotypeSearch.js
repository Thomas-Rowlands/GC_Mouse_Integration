import React from 'react';
import '../Home/App.css';

class PhenotypeSearch extends React.Component {
    render() {
        return (<div class="PhenotypeSearch">
            <div className="searchResultsContainer">
                {/* Orthology Selection */}
                <div className="orthology-menu">
                    <h4>Search for comparative data on human-mouse homologues.</h4>
                    <form className="form" onSubmit="search();return false;">
                        <div className="input-group mb-3 mx-auto">
                            <input type="text" className="form-control" id="userSearchInput" autoComplete="off"
                                   placeholder="Phenotype Search (e.g. body fat)"/>
                            <div id="live-search" className="suggestions">

                            </div>
                        </div>
                        <div className="input-group form-inline mb-3 mx-auto">
                            <div className="input-group-prepend">
                                <div className="input-group-text">Human P-value:</div>
                            </div>
                            <select className="form-control" id="human_pval_select">
                                <option value="0">0</option>
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                                <option value="4">4</option>
                                <option value="5">5</option>
                                <option value="6">6</option>
                                <option value="7">7</option>
                                <option value="8">8</option>
                                <option value="9">9</option>
                                <option value="10">10</option>
                            </select>&nbsp
                            <div className="input-group-prepend">
                                <div className="input-group-text">Mouse P-value:</div>
                            </div>
                            <select className="form-control" id="mouse_pval_select">
                                <option value="0">0</option>
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                                <option value="4">4</option>
                                <option value="5">5</option>
                                <option value="6">6</option>
                                <option value="7">7</option>
                                <option value="8">8</option>
                                <option value="9">9</option>
                                <option value="10">10</option>
                            </select>
                        </div>
                        <div className="input-group-inline">
                            <button type="button" className="btn" id="search_btn">Search</button>
                        </div>
                    </form>
                </div>
                <div id="results-container" className="container">
                    <div className="row">
                        <div className="col">
                            <a className="table-prev btn btn-link disabled" id="prev_page_btn">&lt;- Previous Page</a>
                        </div>
                        <div className="col">
                            <span className="page-counter" id="pageNum">Page 1</span>
                        </div>
                        <div className="col">
                            <a className="table-next btn btn-link disabled" id="next_page_btn">Next Page -&gt;</a>
                        </div>
                    </div>
                    <br/>
                    <table className="info">
                        <tbody id="searchResults">

                        </tbody>
                    </table>
                </div>
            </div>
            {/*Phenotype selection results drill down*/}
            <div id="phenotypeResultsContainer" className="container">
                <a className="btn btn-link" onClick="transition('.searchResultsContainer', true);">Back</a>
                <div className="phenotype-breakdown-container">
                    <div className="row">
                        <h3 id="Selected-Phenotype" className="col">MP:12345 - Micro Foot</h3>
                    </div>
                    {/* Mappings */}
                    <div className="row center">
                        <div className="col">
                            <h3>Homo Sapiens</h3>
                        </div>
                        <div className="col">
                            <h3>Mus Musculus</h3>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col highlight">
                            <span>Human Phenotype Term: </span>
                        </div>
                        <div className="col">
                            <p id="HPO-Matched-Term">HP:12345 Microscopic Foot</p>
                        </div>
                        <div className="col highlight">
                            <span>Mammalian Phenotype Term: </span>
                        </div>
                        <div className="col">
                            <p id="MP-Matched-Term">MP:12345 Micro Foot</p>
                        </div>
                    </div>
                    {/* Synonyms */}
                    <div className="row">
                        <div className="col highlight">
                            <span>Synonyms: </span>
                        </div>
                        <div className="col">
                            <ul>
                                <li>test1</li>
                                <li>test1</li>
                                <li>test1</li>
                                <li>test1</li>
                            </ul>
                        </div>
                        <div className="col highlight">
                            <span>Synonyms: </span>
                        </div>
                        <div className="col">
                            <ul>
                                <li>test1</li>
                                <li>test1</li>
                                <li>test1</li>
                                <li>test1</li>
                            </ul>
                        </div>
                    </div>
                    {/*Studies/Experiments*/}
                    <div className="row">
                        <div className="col highlight">
                            <span>GWAS Studies: </span>
                        </div>
                        <div className="col">
                            <p>12</p>
                        </div>
                        <div className="col highlight">
                            <span>Gene Knockouts: </span>
                        </div>
                        <div className="col">
                            <p>23</p>
                        </div>
                    </div>
                    {/* Homolog Gene Studies/Experiments */}
                    <div className="row">
                        <div className="col center highlight">
                            <span><span id="numHomologousGenes">5</span> Homologous Genes Identified</span>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col center">
                            <ul>
                                <li><a onClick="loadGenomeBrowser();">BRca2</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col center highlight">
                            <span>GWAS Studies</span>
                        </div>
                        <div className="col center highlight">
                            <span>Gene Knockouts</span>
                        </div>
                    </div>
                    <div className="row">
                        <div id="gwas-study-list" className="col center">
                            <ul>
                                <li><a>GWAS of Microscopic Feet</a></li>
                            </ul>
                        </div>
                        <div className="col center">
                            <table className="info">
                                <tbody id="gene-knockout-list">

                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            <div id="browser-iframe-container" className="modal-container">
                <a className="btn" onClick="closeGenomeBrowser();">Close</a>
                <iframe id="genomeBrowser" className="browser-iframe">
                </iframe>
            </div>
        </div>);
    }
}

export default PhenotypeSearch;