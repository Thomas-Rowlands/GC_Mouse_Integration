import React from 'react';
import './PhenotypeSearch.css';
import $ from 'jquery';
import {Button, InputGroup, FormControl, Form, Spinner} from 'react-bootstrap';
import ResultTable from "../UtilityComponents/ResultTable";
import PhenotypeResultBreakdown from "./Components/PhenotypeResultBreakdown";
import axios from "axios";
import LoadingSpinner from "../UtilityComponents/LoadingSpinner/LoadingSpinner";

class PhenotypeSearch extends React.Component {

    constructor(props) {
        super(props);
        this.state = {loading: false, tableData: null, liveSearchResults: [], selectedPhenotype: null, searchOpen: true, breakdownData: null};
        this.search = this.search.bind(this);
        this.searchClick = this.searchClick.bind(this);
        this.retrieveLiveSearch = this.retrieveLiveSearch.bind(this);
        this.liveSearchClick = this.liveSearchClick.bind(this);
        this.searchRowClicked = this.searchRowClicked.bind(this);
        this.resultBreakdownBackClicked = this.resultBreakdownBackClicked.bind(this);
        this.page_num = 1;
    }


    getPreviousResults() {
        if (this.page_num > 1) {
            this.page_num -= 1;
            this.search();
        }
    }

    resultBreakdownBackClicked(btn) {
        this.setState({searchOpen: true});
    }

    getNextResults() {
        this.page_num += 1;
        this.search();
    }

    searchRowClicked(row) {
        let selection = $(row.target).attr("data-id");
        this.setState({selectedPhenotype: selection});
        this.populateGWASRecords(selection);
    }

    liveSearchClick(term) {
        var selection = $(term.currentTarget).text();
        $("#userSearchInput").val(selection);
        $("#live-search").hide();
        this.page_num = 1;
        this.search();
    }

    retrieveLiveSearch() {
        let input = $("#userSearchInput").val();
        let url_string = "http://gcmouseapi/livesearch.php?entry=" + encodeURIComponent(input);
        if (input.length > 0) {
            axios.get(url_string)
                .then((response) => {
                    if (response.status === 200) {
                        if (response.data.length == 0) {
                            $("#live-search").hide();
                        } else {
                            this.setState({liveSearchResults: response.data});
                            $("#live-search").show();
                        }
                    }
                })
                .catch((error) => {
                    console.log("An error occurred retrieving live search results.");
                });
        }
    }

    populateGWASRecords(term) {
        let url_string = "http://gcmouseapi/controller.php?homologSearch=true&term=" + encodeURIComponent(term);
        axios.get(url_string)
            .then((response) => {
                if (response.status === 200) {
                    this.setState({searchOpen: false, breakdownData: response.data[0]});
                }
            })
            .catch((error) => {
                console.log("An error occurred populating GWAS records.");
            });
    }

    search() {
        this.setState({loading: true});
        let search_input = $("#userSearchInput").val();
        let human_pval = parseInt($("#human_pval_select").val());
        let mouse_pval = parseInt($("#mouse_pval_select").val());
        let url_string = "http://gcmouseapi/controller.php?search=" + encodeURIComponent(search_input) + "&page=" + this.page_num + "&offset=" + offset + "&human_pval=" + human_pval + "&mouse_pval=" + mouse_pval;
        axios.get(url_string)
            .then((response) => {
                if (response.status === 200) {
                    if (response.data) {
                        result_total = response.data[1];
                        if (result_total > 0)
                            this.setState({tableData: response.data[0]});
                        else
                            this.setState({tableData: []});
                    }
                    this.setState({loading: false, searchOpen: true});
                }
            })
            .catch((error) => {
                this.setState({loading: false, searchOpen: true});
                console.log("An error occurred searching for phenotype results.");
            });
    }

    searchClick() {
        this.page_num = 1;
        this.search();
    }

    render() {
        const {tableData, liveSearchResults, loading, searchOpen} = this.state;
        if (searchOpen)
            return (<div className="PhenotypeSearch">
                <div className="searchResultsContainer">
                    {/* Orthology Selection */}
                    <div className="orthology-menu">
                        <h4>Search for comparative data on human-mouse homologues.</h4>
                        <Form className="form" onSubmit={this.search}>
                            <InputGroup className="input-group mb-3 mx-auto">
                                <FormControl id="userSearchInput" autoComplete="off"
                                             placeholder="Phenotype Search (e.g. body fat)"
                                             onKeyUp={this.retrieveLiveSearch}/>
                                <div id="live-search" className="suggestions">
                                    {liveSearchResults.map((record) => {
                                        return (<a onClick={this.liveSearchClick}>{record}</a>)
                                    })}
                                </div>
                            </InputGroup>
                            <InputGroup className="input-group form-inline mb-3 mx-auto">
                                <InputGroup.Prepend className="input-group-prepend">
                                    <InputGroup.Text className="input-group-text">Human P-value:</InputGroup.Text>
                                </InputGroup.Prepend>
                                <Form.Control as="select" className="form-control" id="human_pval_select">
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
                                </Form.Control>&nbsp;
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
                            </InputGroup>
                            <div className="input-group-inline">
                                <Button variant="flat" size="xxl" id="search_btn"
                                        onClick={this.searchClick}>Search</Button>
                            </div>
                            <LoadingSpinner loading={loading} />
                        </Form>
                    </div>
                    <ResultTable tableData={tableData} onRowClick={this.searchRowClicked}/>
                </div>
                {/*Phenotype selection results drill down*/}
                <div id="browser-iframe-container" className="modal-container">
                    <a className="btn" onClick={closeGenomeBrowser}>Close</a>
                    <iframe id="genomeBrowser" className="browser-iframe">
                    </iframe>
                </div>
            </div>);
        else
            return (
                <PhenotypeResultBreakdown selectedPhenotype={this.state.selectedPhenotype} breakdownData={this.state.breakdownData} backBtnClick={this.resultBreakdownBackClicked}/>
            );
    }
}

var offset = 20;
var result_total = 0;
var current_div = ".searchResultsContainer";

function loadGenomeBrowser() {
    $("#browser-iframe-container").show(
        {
            effect: "scale",
            duration: 500,
            complete: function () {
                $("#genomeBrowser").attr("src", "jbrowse/index.html?data=data");
            }
        }
    );
    $("body").css("background-color", "grey");
}

function closeGenomeBrowser() {
    $("#genomeBrowser").attr("src", "");
    setTimeout(
        function () {
            $("#browser-iframe-container").hide(
                {
                    effect: "scale",
                    duration: 500
                }
            );
        },
        300
    );
    $("body").css("background-color", "white");
}


export default PhenotypeSearch;