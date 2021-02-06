import React from "react";
import './PhenotypeResultBreakdown.css';
import ResultTable from "../../UtilityComponents/ResultTable";
import $ from "jquery";
import axios from "axios";

class PhenotypeResultBreakdown extends React.Component {
    constructor(props) {
        super(props);
        this.state = {selectedPhenotype: "", GWASData: null, backBtnClick: null};
    }

    populateGWASRecords() {
        let url_string = "http://gcmouseapi/controller.php?homologSearch=true&term=" + encodeURIComponent(this.state.selectedPhenotype);
        axios.get(url_string)
                .then((response) => {
                    if (response.status === 200) {
                        if (response.data.length > 0) {
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



        return $.ajax({
            type: "GET",
            url: "http://gcmouseapi/controller.php?homologSearch=true&term=" + encodeURIComponent(this.state.selectedPhenotype),
            success: function (data) {
                $("#live-search").empty();
                if (data) {
                    data = JSON.parse(data);
                    let result_total = data[1];
                    data = data[0];
                    let headings = Object.keys(data[0]);
                    let result = "<tr>";
                    headings.forEach(element => {
                        result += "<th>" + element + "</th>";
                    });
                    result += "</tr>";
                    for (var i = 0; i < data.length; i++) {
                        result += "<tr onclick=''>";
                        headings.forEach(element => {
                            result += "<td>" + data[i][element] + "</td>";
                        });
                        result += "</tr>";
                    }
                    $("#gene-knockout-list").html(result);
                }
            }
        });
    }

    render() {
        return (
            <div id="phenotypeResultsContainer" className="container">
                <a className="btn btn-link" onClick={this.props.backBtnClick}>Back</a>
                <div className="phenotype-breakdown-container">
                    <div className="row">
                        <h3 id="Selected-Phenotype" className="col">{}</h3>
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
                            <ResultTable tableData={this.props.GwasData}/>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default PhenotypeResultBreakdown;