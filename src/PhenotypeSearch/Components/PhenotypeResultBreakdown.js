import React from "react";
import './PhenotypeResultBreakdown.css';
import ResultTable from "../../UtilityComponents/ResultTable";
import $ from "jquery";
import axios from "axios";
import LoadingSpinner from "../../UtilityComponents/LoadingSpinner/LoadingSpinner";
import configData from "../../Config/config.json";
import {forEach} from "react-bootstrap/ElementChildren";

class PhenotypeResultBreakdown extends React.Component {
    constructor(props) {
        super(props);
        this.gwasStudyClicked = this.gwasStudyClicked.bind(this);
        this.experimentClicked = this.experimentClicked.bind(this);
        this.state = {selectedPhenotype: "", breakdownData: null, backBtnClick: null, loading:true};
    }

    componentDidMount() {
        this.getBreakdownData();
    }

    gwasStudyClicked(row) {
        let studyID = $(row.currentTarget).attr("data-id");
        var win = window.open("https://www.gwascentral.org/study/" + studyID, "_blank");
        if (win)
            win.focus();
    }

    experimentClicked(row) {
        let selection = $(row.target).attr("data-id");
    }

    getBreakdownData() {
        let url_string = configData.api_server + "controller.php?type=study&phenotypeBreakdown=&term=" + this.props.selectedPhenotype;
        axios.get(url_string)
            .then((response) => {
                if (response.status === 200) {
                    if (response.data) {
                        this.setState({breakdownData: response.data, loading: false});
                    } else {

                    }
                }
            })
            .catch((error) => {
                console.log("An error occurred retrieving phenotype data.");
            });
    }

    getHumanTerm(breakdownData) {
        if (breakdownData) {
            if (breakdownData["Mappings"].length > 0) {
                if (breakdownData["Mappings"][0]["sourceID"].includes("HP"))
                    return breakdownData["Mappings"][0]["sourceID"] + " " + breakdownData["Mappings"][0]["sourceLabel"];
                else
                    return breakdownData["Mappings"][0]["mappedID"] + " " + breakdownData["Mappings"][0]["mappedLabel"];
            } else {
                return "No mapping found";
            }
        }
    }

    getMouseTerm(breakdownData) {
        if (breakdownData) {
            if (breakdownData["Mappings"].length > 0) {
                if (breakdownData["Mappings"][0]["sourceID"].includes("MP"))
                    return breakdownData["Mappings"][0]["sourceID"] + " " + breakdownData["Mappings"][0]["sourceLabel"];
                else
                    return breakdownData["Mappings"][0]["mappedID"] + " " + breakdownData["Mappings"][0]["mappedLabel"];
            } else {
                return "No mapping found";
            }
        }
    }

    getGWASStudies(breakdownData) {
        if (breakdownData) {
            if (breakdownData["GWAS Studies"].length > 0) {

            } else {
                return "0";
            }
        }
    }

    getGeneKnockouts(breakdownData) {
        if (breakdownData) {
            if (breakdownData["Gene Knockouts"].length > 0) {

            } else {
                return "0";
            }
        }
    }

    getMappedSynonyms(breakdownData) {
        if (breakdownData) {
            if (breakdownData["Mappings"][0]["mappedSynonyms"].length > 0) {
                return breakdownData["Mappings"][0]["mappedSynonyms"].map((synonym, index) =>
                <li>{synonym}</li>);
            } else {
                return <li>None</li>;
            }
        }
    }

    getSourceSynonyms(breakdownData) {
        if (breakdownData) {
            if (breakdownData["Mappings"][0]["sourceSynonyms"].length > 0) {
                return breakdownData["Mappings"][0]["sourceSynonyms"].map((synonym, index) =>
                <li>{synonym}</li>);
            } else {
                return <li>None</li>;
            }
        }
    }

    render() {
        const {breakdownData, loading} = this.state;
        return (
            <div id="phenotypeResultsContainer" className="container">
                <LoadingSpinner loading={loading} />
                {this.props.backBtnClick ? <a className="btn btn-link" onClick={this.props.backBtnClick}>Back</a>: null}
                <div className="phenotype-breakdown-container">
                    <div className="row">
                        <h3 id="Selected-Phenotype" className="col">{this.props.selectedPhenotype}</h3>
                    </div>
                    {/* Mappings */}
                    <div className="row center">
                        <div className="col">
                            <h4>Homo Sapiens</h4>
                        </div>
                        <div className="col">
                            <h4>Mus Musculus</h4>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col highlight">
                            <span>Human Phenotype Term: </span>
                        </div>
                        <div className="col">
                            <p id="HPO-Matched-Term">{this.getHumanTerm(breakdownData)}</p>
                        </div>
                        <div className="col highlight">
                            <span>Mammalian Phenotype Term: </span>
                        </div>
                        <div className="col">
                            <p id="MP-Matched-Term">{this.getMouseTerm(breakdownData)}</p>
                        </div>
                    </div>
                    {/* Synonyms */}
                    <div className="row">
                        <div className="col highlight">
                            <span>Synonyms: </span>
                        </div>
                        <div className="col">
                            <ul>
                                {this.getMappedSynonyms(breakdownData)}
                            </ul>
                        </div>
                        <div className="col highlight">
                            <span>Synonyms: </span>
                        </div>
                        <div className="col">
                            <ul>
                                {this.getSourceSynonyms(breakdownData)}
                            </ul>
                        </div>
                    </div>
                    {/*Studies/Experiments*/}
                    <div className="row">
                        <div className="col highlight">
                            <span>GWAS Studies: </span>
                        </div>
                        <div className="col">
                            <p>{breakdownData ? breakdownData["GWAS Studies"].length: 0}</p>
                        </div>
                        <div className="col highlight">
                            <span>Gene Knockouts: </span>
                        </div>
                        <div className="col">
                            <p>{breakdownData ? breakdownData["Gene Knockouts"].length: 0}</p>
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
                        <div className="col center">
                            {breakdownData ? <ResultTable tableData={breakdownData["GWAS Studies"]} onRowClick={this.gwasStudyClicked}/>: null}
                        </div>
                        <div className="col center">
                            {breakdownData ? <ResultTable tableData={breakdownData["Gene Knockouts"]} onRowClick={this.experimentClicked}/>: null}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default PhenotypeResultBreakdown;