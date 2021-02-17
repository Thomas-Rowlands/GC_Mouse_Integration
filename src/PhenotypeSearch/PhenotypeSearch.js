import React from 'react';
import './PhenotypeSearch.css';
import $ from 'jquery';
import {Button, InputGroup, FormControl, Form, Spinner} from 'react-bootstrap';
import ResultTable from "../UtilityComponents/ResultTable";
import PhenotypeResultBreakdown from "./Components/PhenotypeResultBreakdown";
import axios from "axios";
import LoadingSpinner from "../UtilityComponents/LoadingSpinner/LoadingSpinner";
import configData from '../Config/config.json';

class PhenotypeSearch extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            selectedSpecies: "Mouse",
            loading: false,
            tableData: null,
            liveSearchResults: [],
            selectedPhenotype: null,
            searchOpen: true,
            breakdownData: null
        };
        this.search = this.search.bind(this);
        this.searchClick = this.searchClick.bind(this);
        this.retrieveLiveSearch = this.retrieveLiveSearch.bind(this);
        this.liveSearchClick = this.liveSearchClick.bind(this);
        this.searchRowClicked = this.searchRowClicked.bind(this);
        this.resultBreakdownBackClicked = this.resultBreakdownBackClicked.bind(this);
        this.speciesRadioChanged = this.speciesRadioChanged.bind(this);
        this.getPreviousResults = this.getPreviousResults.bind(this);
        this.getNextResults = this.getNextResults.bind(this);
        this.preventFormSubmit = this.preventFormSubmit.bind(this);
        this.page_num = 1;
        this.liveCancelToken = axios.CancelToken.source();
    }

    componentDidMount() {
        $("#userSearchInput").focusin(function () {
            $("#live-search").show();
        });
        $("#userSearchInput").focusout(function () {
            $("#live-search").hide();
        })
    }

    getPreviousResults() {
        if (this.page_num > 1) {
            this.page_num -= 1;
            this.search();
        }
    }

    preventFormSubmit(e) {
        e.preventDefault();
        this.search();
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
        this.setState({selectedPhenotype: selection, searchOpen: false});
    }

    liveSearchClick(term) {
        var selection = $(term.currentTarget.lastChild).text();
        $("#userSearchInput").val(selection);
        $("#live-search").hide();
        this.page_num = 1;
        this.search();
    }

    retrieveLiveSearch() {
        let input = $("#userSearchInput").val();
        if (input.length < 1) {
            $("#live-search").hide();
            return;
        }
        let url_string = configData.api_server + "livesearch.php?entry=" + encodeURIComponent(input) + "&species=" + this.state.selectedSpecies;
        if (input.length > 0) {
            axios.get(url_string, {cancelToken: this.liveCancelToken.token})
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

    search() {
        this.setState({loading: true});
        let search_input = $("#userSearchInput").val();
        let human_pval = parseInt($("#human_pval_select").val());
        let mouse_pval = parseInt($("#mouse_pval_select").val());

        let url_string = configData.api_server + "/controller.php?type=study&search=" + encodeURIComponent(search_input) + "&page=" + this.page_num + "&human_pval=" + human_pval + "&mouse_pval=" + mouse_pval + "&species=" + this.state.selectedSpecies;
        axios.get(url_string)
            .then((response) => {
                if (response.status === 200) {
                    if (response.data) {
                        result_total = response.data[1];
                        if (result_total > 0) {
                            this.setState({tableData: response.data[0], loading: false, searchOpen: true});
                        } else {
                            this.setState({tableData: "No results found.", loading: false, searchOpen: true});
                        }
                    } else {
                        this.setState({loading: false, searchOpen: true, tableData: null});
                    }
                }
            })
            .catch((error) => {
                this.setState({loading: false, searchOpen: true, tableData: null});
                console.log("An error occurred searching for phenotype results.");
            });
    }

    searchClick(e) {
        e.preventDefault();
        this.page_num = 1;
        this.search();
    }

    speciesRadioChanged(e) {
        if (e.target.id === "mouse-radio") {
            this.setState({selectedSpecies: "Mouse"});
        } else {
            this.setState({selectedSpecies: "Human"});
        }
    }

    displayTable(tableData) {
        if (tableData === "No results found.")
            return <p className="center"><br/>{tableData}</p>
        else
            return <ResultTable tableData={tableData} onRowClick={this.searchRowClicked}/>

    }

    render() {
        const {tableData, liveSearchResults, loading, searchOpen, selectedSpecies} = this.state;
        if (searchOpen)
            return (<div className="PhenotypeSearch">
                <div className="searchResultsContainer">
                    {/* Orthology Selection */}
                    <div className="orthology-menu">
                        <h4>Search for comparative data on human-mouse homologues.</h4>
                        <Form className="form" onSubmit={this.preventFormSubmit}>
                            <InputGroup className="input-group mb-3 mx-auto">
                                <FormControl id="userSearchInput" autoComplete="off"
                                             placeholder={selectedSpecies === "Human" ? "Human Phenotype (e.g. \n" +
                                                 "disproportionate tall stature)" : "Mouse Phenotype (e.g. abnormal lung elastance)"}
                                             onKeyUp={this.retrieveLiveSearch}/>
                                <div id="live-search" className="suggestions">
                                    {liveSearchResults ? liveSearchResults.map((record) => {
                                        return (<a onClick={this.liveSearchClick}>
                                            <div style={{
                                                float: 'left',
                                                'padding-left': '2%'
                                            }}>{record.ontology.toUpperCase()}</div>
                                            {record.FSN}</a>)
                                    }) : null}
                                </div>
                            </InputGroup>
                            <InputGroup className="input-group form-inline mb-3 mx-auto center">
                                <Form.Check name="speciesRadio" onChange={this.speciesRadioChanged}
                                            checked={selectedSpecies === "Human"} inline label="Human" type="radio"
                                            id="human-radio"/>
                                <Form.Check name="speciesRadio" onChange={this.speciesRadioChanged}
                                            checked={selectedSpecies === "Mouse"} inline label="Mouse" type="radio"
                                            id="mouse-radio"/>
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
                            <LoadingSpinner loading={loading}/>
                        </Form>
                    </div>
                    {tableData ? this.displayTable(tableData) : null}

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
                <PhenotypeResultBreakdown selectedPhenotype={this.state.selectedPhenotype}
                                          breakdownData={this.state.breakdownData}
                                          backBtnClick={this.resultBreakdownBackClicked}/>
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