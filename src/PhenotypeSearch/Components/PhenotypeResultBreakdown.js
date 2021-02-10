import React from "react";
import './PhenotypeResultBreakdown.css';
import ResultTable from "../../UtilityComponents/ResultTable";
import $ from "jquery";
import axios from "axios";
import LoadingSpinner from "../../UtilityComponents/LoadingSpinner/LoadingSpinner";

class PhenotypeResultBreakdown extends React.Component {
    constructor(props) {
        super(props);
        this.state = {selectedPhenotype: "", breakdownData: null, backBtnClick: null, loading:true};
    }

    componentDidMount() {
        this.getBreakdownData();
    }

    getBreakdownData() {
        let url_string = "http://gcmouseapi/controller.php?phenotypeBreakdown=&term=" + this.props.selectedPhenotype;
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

    render() {
        const {breakdownData, loading} = this.state;
        return (
            <div id="phenotypeResultsContainer" className="container">
                <LoadingSpinner loading={loading} />
                <a className="btn btn-link" onClick={this.props.backBtnClick}>Back</a>
                <div className="phenotype-breakdown-container">
                    <div className="row">
                        <h3 id="Selected-Phenotype" className="col">{this.props.selectedPhenotype}</h3>
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
                                <li>None</li>
                            </ul>
                        </div>
                        <div className="col highlight">
                            <span>Synonyms: </span>
                        </div>
                        <div className="col">
                            <ul>
                                <li>None</li>
                            </ul>
                        </div>
                    </div>
                    {/*Studies/Experiments*/}
                    <div className="row">
                        <div className="col highlight">
                            <span>GWAS Studies: </span>
                        </div>
                        <div className="col">
                            <p>{this.getGWASStudies(breakdownData)}</p>
                        </div>
                        <div className="col highlight">
                            <span>Gene Knockouts: </span>
                        </div>
                        <div className="col">
                            <p>{this.getGeneKnockouts(breakdownData)}</p>
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
                        {/*<div className="col center">*/}
                        {/*    <ResultTable tableData={breakdownData["GWAS Studies"]}/>*/}
                        {/*</div>*/}
                    </div>
                </div>
            </div>
        );
    }
}

export default PhenotypeResultBreakdown;